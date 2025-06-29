import os
from fastapi_users import BaseUserManager, IntegerIDMixin
from models import User

SECRET = os.environ.get("SECRET", "changeme")

class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user: User, request=None):
        print(f"Utilisateur enregistré : {user.id}")

    async def on_after_forgot_password(self, user: User, token: str, request=None):
        print(f"Mot de passe oublié pour l'utilisateur {user.id}. Token: {token}")

    async def on_after_request_verify(self, user: User, token: str, request=None):
        print(f"Vérification demandée pour l'utilisateur {user.id}. Token: {token}") 