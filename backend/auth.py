from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import supabase

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
        db_user = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not db_user.data:
            # Create user on the fly
            new_user = {
                "id": user_id,
                "tenant_id": user_id, # Default tenant is user's own id
                "role": "admin",
                "permitted_doc_types": ["NDA", "EMPLOYMENT_CONTRACT", "BOARD_RESOLUTION", "SHAREHOLDER_AGREEMENT"]
            }
            try:
                supabase.table("users").insert(new_user).execute()
                return new_user
            except Exception as e:
                print(f"Failed to create user record: {e}")
                raise HTTPException(status_code=401, detail="User record not found and could not be created")
            
        return db_user.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
