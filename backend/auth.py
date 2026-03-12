from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.database import supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not supabase:
        # Mock user for local dev without Supabase
        return {"id": "mock-user", "tenant_id": "mock-tenant", "role": "admin", "permitted_doc_types": ["NDA", "EMPLOYMENT_CONTRACT", "BOARD_RESOLUTION", "SHAREHOLDER_AGREEMENT"]}
        
    token = credentials.credentials
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user_id = user_res.user.id
        db_user = supabase.table("users").select("*").eq("id", user_id).single().execute()
        
        if not db_user.data:
            raise HTTPException(status_code=401, detail="User record not found")
            
        return db_user.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
