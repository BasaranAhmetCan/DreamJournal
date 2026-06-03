import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# firebase_admin uygulamasını başlat
current_dir = os.getcwd()
cred_path = os.path.join(current_dir, "serviceAccountKey.json")

# Sadece ilk çağrıda başlatılması için kontrol et
if not firebase_admin._apps:
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        print(f"UYARI: {cred_path} bulunamadı! Firebase Admin başlatılamadı. Auth doğrulama başarısız olacak.")

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Bu fonksiyon FastAPI'de bir Dependency olarak kullanılır.
    Gelen istekteki Authorization header'ından token'ı alır ve Firebase üzerinden doğrular.
    """
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
        return decoded_token
    except Exception as e:
        print(f"AUTH ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Geçersiz token veya yetkilendirme hatası: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
