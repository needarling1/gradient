import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate("syllo-341ed-firebase-adminsdk-fbsvc-31907d9b0d.json") 
    firebase_admin.initialize_app(cred)

db = firestore.client()
