from django.contrib import admin
from django.urls import path, include
from api.views import RegisterAPIView, ResetPasswordAPIView, ForgotPasswordAPIView, MeAPIView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView
)
from drf_spectacular.views import SpectacularSwaggerView, SpectacularAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/register/', RegisterAPIView.as_view(), name='user-registration'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('auth/login/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='user-logout'),
    path('forgot-password/', ForgotPasswordAPIView.as_view()),
    path('reset-password/<uidb64>/<token>', ResetPasswordAPIView.as_view()),
    path('url/', include('api.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('me/', MeAPIView.as_view())
]
