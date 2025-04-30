from fastapi import FastAPI, HTTPException, Body, File, UploadFile, Query, Form
from starlette.middleware.cors import CORSMiddleware
from firebase_config import db
from io import BytesIO
import PyPDF2
import os
import json
from openai import OpenAI
from dotenv import load_dotenv
import httpx
from firebase_admin import firestore
from pydantic import BaseModel
from gradescopeapi.classes.connection import GSConnection
import asyncio
from typing import Optional, Union
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import status


load_dotenv()
env = os.environ

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["exp://10.2.14.234:8081/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreateRequest(BaseModel):
    user_id: str
    email: str

class OnboardingRequest(BaseModel):
    user_id: str
    firstName: str
    lastName: str
    majors: Optional[Union[list[str], str, None]] = None
    departments: Optional[Union[list[str], str, None]] = None
    gpa: str
    graduationYear: str
    bcourseToken: str
    profileImage: str = None

class UpdateGradeOptionsRequest(BaseModel):
    user_id: str
    class_name: str
    grade_style: str  # 'raw' or 'curved'
    grade_platform: str  # 'canvas' or 'gradescope'
    predicted_grade: Optional[float] = None

class SetPredictedGradeRequest(BaseModel):
    user_id: str
    class_name: str
    predicted_grade: float

@app.post("/create_user")
async def create_user(user: UserCreateRequest):
    try:
        user_ref = db.collection('users').document(user.user_id)
        user_doc = user_ref.get()

        if user_doc.exists:
            return {"message": "User already exists"}

        # Create new user document
        user_ref.set({
            "email": user.email,
            "classes": []  # Initialize with empty classes list
        })

        return {"message": "User created successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.post("/onboard_user")
async def onboard_user(onboarding: OnboardingRequest):
    try:
        user_ref = db.collection('users').document(onboarding.user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        # Normalize majors and departments to lists of strings
        def normalize_list(val):
            if val is None:
                return []
            if isinstance(val, list):
                return [str(x) for x in val if x is not None]
            if isinstance(val, str):
                return [val]
            return []

        majors = normalize_list(onboarding.majors)
        departments = normalize_list(onboarding.departments)

        # Update user document with onboarding information
        user_ref.update({
            "firstName": onboarding.firstName,
            "lastName": onboarding.lastName,
            "majors": majors,
            "departments": departments,
            "gpa": onboarding.gpa,
            "graduationYear": onboarding.graduationYear,
            "bcourseToken": onboarding.bcourseToken,
            "profileImage": onboarding.profileImage,
            "hasOnboarded": True
        })

        return {"message": "User onboarding completed successfully"}

    except RequestValidationError as ve:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": ve.errors(), "body": ve.body},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@app.post("/syllabus-parse")
async def parse_syllabus(
    syllabus: UploadFile = File(...),
    user_id: str = Form(...),
    class_name: str = Form(...)
):
    file_bytes = await syllabus.read()
    file_like = BytesIO(file_bytes)

    prompt = extract_text_from_pdf(file_like)

    client = OpenAI(
        api_key=env.get('OPENAI_KEY'),
        organization=env.get('ORG'),
        project=env.get('PROJECT'), 
    )

    thread = client.beta.threads.create()

    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=prompt
    )

    run = client.beta.threads.runs.create_and_poll(
        thread_id=thread.id,
        assistant_id=env.get('ASSISTANT'),
    )

    if run.status == 'completed':
        messages = client.beta.threads.messages.list(thread_id=thread.id)

    last_message = messages.data[0]
    response = json.loads(remove_newlines(last_message.content[0].text.value))

    # NEW: Upload to user-specific collection
    upload_user_course(response, user_id, class_name)
    print(response)
    return {"message": response}

def remove_newlines(input_string):
    return input_string.replace("\n", "")

def extract_text_from_pdf(file_like):
    pdf_reader = PyPDF2.PdfReader(file_like)
    full_text = ""
    
    for page in pdf_reader.pages:
        text = page.extract_text()
        if text:
            full_text += text
            
    return full_text


def upload_user_course(course: dict, user_id: str, class_name: str):
    try:
        course_name = course.get("course_name", "Unknown Course").replace(" ", "_")

        db.collection('users').document(user_id).collection('courses').document(class_name).set(course)

        return {"message": "Course uploaded successfully", "course_name": course_name}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/user_course/{user_id}/{class_name}")
async def get_user_course(user_id: str, class_name: str):
    try:
        doc_ref = db.collection('users').document(user_id).collection('courses').document(class_name)
        doc = doc_ref.get()

        if not doc.exists:
            return {"course_found": False}

        return {"course_found": True, "course_data": doc.to_dict()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user course: {str(e)}")

    
CANVAS_API_URL = "https://bcourses.berkeley.edu/api/v1"
PAT = env.get('PAT')

async def fetch_all_courses():
    headers = {
        "Authorization": f"Bearer {PAT}",
        "Content-Type": "application/json",
    }
    params = {
        "enrollment_state": "active",
        "state[]": "available",
        "per_page": 100
    }

    all_courses = []
    url = f"{CANVAS_API_URL}/courses"

    async with httpx.AsyncClient() as client:
        while url:
            response = await client.get(url, headers=headers, params=params)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch courses from Canvas")
            
            courses = response.json()
            all_courses.extend(courses)
            link = response.headers.get("Link")
            url = None
            if link:
                links = link.split(",")
                for l in links:
                    if 'rel="next"' in l:
                        url = l[l.find("<")+1:l.find(">")]
                        break 

            params = {}
    return all_courses

@app.get("/get_user_courses")
async def get_user_courses(user_id: str = Query(...)):
    try:
        user_doc_ref = db.collection('users').document(user_id)
        user_doc = user_doc_ref.get()

        if user_doc.exists:
            user_data = user_doc.to_dict()
            if "classes" in user_data and user_data["classes"]:
                print(f"Found existing classes for user {user_id}: {user_data['classes']}")
                return user_data["classes"]

        all_courses = await fetch_all_courses()
        spring_2025_courses = [course for course in all_courses if course.get("enrollment_term_id") == 5646]

        user_doc_ref.set({
            "classes": spring_2025_courses
        }, merge=True)

        print(f"Stored {len(spring_2025_courses)} classes for user {user_id}")
        return spring_2025_courses

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user courses: {str(e)}")
    
async def fetch_assignments_with_submissions(course_id: str, user_id: str):
    headers = {
        "Authorization": f"Bearer {PAT}",
        "Content-Type": "application/json",
    }
    params = {
        "include[]": "submission", 
        "student_ids[]": user_id,
        "per_page": 100
    }
    url = f"{CANVAS_API_URL}/courses/{course_id}/assignments"

    all_assignments = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        retries = 0
        max_retries = 3
        
        while url:
            try:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()

                data = response.json()
                if isinstance(data, list):
                    all_assignments.extend(data)
                else:
                    raise ValueError("Unexpected data format, expected a list.")

                # Pagination handling
                link_header = response.headers.get('link')
                url = None
                if link_header:
                    links = link_header.split(',')
                    for link in links:
                        if 'rel="next"' in link:
                            url = link[link.find('<')+1:link.find('>')]
                            params = {}  # Clear params when following next URL
                            break
                retries = 0  # Reset retries after successful page fetch
            except (httpx.HTTPError, ValueError) as e:
                retries += 1
                if retries > max_retries:
                    raise HTTPException(status_code=502, detail=f"Failed fetching assignments after retries: {str(e)}")
                await asyncio.sleep(1.5 * retries)  # Exponential backoff

    return all_assignments

GRADESCOPE_EMAIL = os.getenv('GRADESCOPE_EMAIL')
GRADESCOPE_PASSWORD = os.getenv('GRADESCOPE_PASSWORD')

def normalize_course_name(course_name: str) -> str:
    """
    Normalize course names for comparison by:
    1. Converting to uppercase
    2. Removing common prefixes/suffixes
    3. Removing special characters and extra spaces
    """
    # Convert to uppercase
    name = course_name.upper()
    
    # Remove common prefixes/suffixes and section identifiers
    prefixes_to_remove = [
        "SPRING 2024 ", "FALL 2024 ", "SPRING 2025 ", "FALL 2023 ",
        "SP24 ", "FA24 ", "SP25 ", "FA23 ",
        "LEC ", "DIS ", "LAB ", "-LEC", "-DIS", "-LAB",
        "HWS", "EXAMS", "(SPRING 2025)", "(FALL 2024)", "(SPRING 2024)", "(FALL 2023)"
    ]
    for prefix in prefixes_to_remove:
        name = name.replace(prefix.upper(), "")
    
    # Remove special characters and normalize spaces
    import re
    name = re.sub(r'[^\w\s]', ' ', name)  # Replace special chars with space
    name = re.sub(r'\s+', ' ', name)      # Normalize multiple spaces to single space
    
    # Remove common course number patterns
    name = re.sub(r'\b\d{3}\/\d{3}\b', '', name)  # Remove patterns like "215/216"
    
    return name.strip()

def find_matching_gradescope_course(canvas_course, gradescope_courses):
    """
    Find the matching Gradescope course using multiple matching strategies.
    Returns tuple of (course_id, course) if found, else (None, None)
    """
    canvas_name = canvas_course.get("name", "")
    canvas_code = canvas_course.get("course_code", "")
    
    normalized_canvas_name = normalize_course_name(canvas_name)
    normalized_canvas_code = normalize_course_name(canvas_code)
    
    print(f"Canvas course: {canvas_name} ({canvas_code})")
    print(f"Normalized canvas name: {normalized_canvas_name}")
    print(f"Normalized canvas code: {normalized_canvas_code}")
    
    best_match = (None, None)
    
    for course_id, gs_course in gradescope_courses.items():
        # Try matching against both name and full_name
        gs_name = gs_course.name
        gs_full_name = gs_course.full_name
        
        normalized_gs_name = normalize_course_name(gs_name)
        normalized_gs_full_name = normalize_course_name(gs_full_name)
        
        print(f"Comparing with Gradescope course: {gs_name} ({gs_full_name})")
        print(f"Normalized Gradescope name: {normalized_gs_name}")
        print(f"Normalized Gradescope full name: {normalized_gs_full_name}")
        
        # Check for exact matches first
        if (normalized_canvas_name in normalized_gs_name or 
            normalized_canvas_name in normalized_gs_full_name or
            normalized_canvas_code in normalized_gs_name or
            normalized_canvas_code in normalized_gs_full_name):
            
            # Prefer current semester courses
            if gs_course.semester == "Spring" and gs_course.year == "2025":
                print(f"Found current semester match: {gs_name}")
                return course_id, gs_course
            elif best_match == (None, None):
                best_match = (course_id, gs_course)
    
    return best_match

async def fetch_gradescope_assignments(course_id: str):
    try:
        # Create Gradescope connection
        connection = GSConnection()
        connection.login(GRADESCOPE_EMAIL, GRADESCOPE_PASSWORD)
        
        # Get all courses
        courses = connection.account.get_courses()
        gradescope_courses = courses.get("student", {})
        print(f"Found {len(gradescope_courses)} Gradescope courses")
        
        # Get Canvas course details
        canvas_course = next((c for c in await fetch_all_courses() if str(c["id"]) == course_id), None)
        if not canvas_course:
            print(f"Canvas course not found for ID: {course_id}")
            return []
        
        # Find matching course
        gs_course_id, matching_course = find_matching_gradescope_course(canvas_course, gradescope_courses)
        
        if not matching_course:
            print(f"No matching Gradescope course found for: {canvas_course.get('name')}")
            return []
            
        print(f"Found matching course: {matching_course.name} ({matching_course.full_name})")
        
        # Get assignments for the course using the course_id from the dictionary key
        assignments = connection.account.get_assignments(gs_course_id)
        
        # Format assignments to match Canvas format
        formatted_assignments = []
        for assignment in assignments:
            formatted_assignment = {
                "id": f"gs_{assignment.assignment_id}",
                "name": assignment.name,
                "points_possible": assignment.max_grade,
                "due_at": assignment.due_date.isoformat() if assignment.due_date else None,
                "source": "gradescope",
                "status": assignment.submissions_status,
                "late_due_date": assignment.late_due_date.isoformat() if assignment.late_due_date else None,
                "release_date": assignment.release_date.isoformat() if assignment.release_date else None
            }
            
            # Add score if available and submitted
            if hasattr(assignment, 'grade') and assignment.grade is not None:
                formatted_assignment["score"] = assignment.grade
            
            formatted_assignments.append(formatted_assignment)
            
        print(f"Found {len(formatted_assignments)} Gradescope assignments")
        return formatted_assignments
        
    except Exception as e:
        print(f"Error fetching Gradescope assignments: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return []

@app.get("/get_gradescope_assignments")
async def get_gradescope_assignments(course_id: str = Query(...)):
    try:
        assignments = await fetch_gradescope_assignments(course_id)
        return {"assignments": assignments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching Gradescope assignments: {str(e)}")

@app.get("/get_assignments")
async def get_assignments(course_id: str = Query(...), user_id: str = Query(...)):
    try:
        assignments = await fetch_assignments_with_submissions(course_id, user_id)

        final_assignments = []

        for assignment in assignments:
            base_info = {
                "id": assignment.get("id"),
                "name": assignment.get("name"),
                "points_possible": assignment.get("points_possible"),
                "due_at": assignment.get("due_at"),
                "source": "canvas"  # Add source field
            }

            # Safely handle missing submission
            submission = assignment.get("submission")
            if submission:
                score = submission.get("score")
                if score is not None:
                    base_info["score"] = score

            final_assignments.append(base_info)

        return {"assignments": final_assignments}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching assignments: {str(e)}")

@app.get("/check_onboarding/{user_id}")
async def check_onboarding(user_id: str):
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user_doc.to_dict()
        return {
            "hasOnboarded": user_data.get("hasOnboarded", False),
            "userData": {
                "firstName": user_data.get("firstName"),
                "lastName": user_data.get("lastName"),
                "majors": user_data.get("majors", []),
                "departments": user_data.get("departments", []),
                "gpa": user_data.get("gpa"),
                "graduationYear": user_data.get("graduationYear"),
                "profileImage": user_data.get("profileImage")
            } if user_data.get("hasOnboarded", False) else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking onboarding status: {str(e)}")

@app.get("/user_info/{user_id}")
async def get_user_info(user_id: str):
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        return user_doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user info: {str(e)}")

@app.post("/update_course_grade_options")
async def update_course_grade_options(options: UpdateGradeOptionsRequest):
    try:
        update_data = {
            "grade_style": options.grade_style,
            "grade_platform": options.grade_platform
        }
        if options.predicted_grade is not None:
            update_data["predicted_grade"] = options.predicted_grade
        course_ref = db.collection('users').document(options.user_id).collection('courses').document(options.class_name)
        course_ref.set(update_data, merge=True)
        return {"message": "Grade options updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating grade options: {str(e)}")

@app.post("/set_predicted_grade")
async def set_predicted_grade(data: SetPredictedGradeRequest):
    try:
        course_ref = db.collection('users').document(data.user_id).collection('courses').document(data.class_name)
        course_ref.set({"predicted_grade": data.predicted_grade}, merge=True)
        return {"message": "Predicted grade updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating predicted grade: {str(e)}")

