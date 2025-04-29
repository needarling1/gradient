from fastapi import FastAPI, HTTPException, Body
from starlette.middleware.cors import CORSMiddleware
from firebase_config import db
from fastapi import File, UploadFile, Query, Form
from io import BytesIO
import PyPDF2
import os
import json
from openai import OpenAI
from dotenv import load_dotenv
import httpx
from firebase_admin import firestore
from pydantic import BaseModel


load_dotenv()
env = os.environ

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["exp://10.40.137.71:8081/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreateRequest(BaseModel):
    user_id: str
    email: str

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

        course_codes = [course.get("course_code") for course in spring_2025_courses if course.get("course_code")]

        user_doc_ref.set({
            "classes": course_codes
        }, merge=True)

        print(f"Stored {len(course_codes)} classes for user {user_id}")
        return course_codes

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user courses: {str(e)}")
