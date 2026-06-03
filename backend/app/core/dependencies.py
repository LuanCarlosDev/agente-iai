from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import decode_access_token
from app.models.models import Usuario

# Injetor de autenticação HTTP Bearer para extrair o token do cabeçalho de Autorização
security_bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Dependency to validate JWT and return the currently authenticated user.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_email = payload.get("sub")
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token mal formatado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(Usuario).filter(Usuario.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )
        
    return user

def require_adm(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Dependency to ensure the current user is an Administrator (adm).
    """
    if current_user.role != "adm":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem acessar este recurso.",
        )
    return current_user

def require_gestor(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Dependency to ensure the current user is at least a Manager (gestor or adm).
    """
    if current_user.role not in ["adm", "gestor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Recurso exclusivo para gestores.",
        )
    return current_user

def require_secretaria(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Dependency to ensure the current user has at least receptionist rights (secretaria, gestor, adm).
    """
    if current_user.role not in ["adm", "gestor", "secretaria"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Permissões insuficientes.",
        )
    return current_user
