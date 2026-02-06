from django.shortcuts import render, get_object_or_404
from api.serializers import RegisterSerializer
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, DjangoModelPermissions, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from api.models import User, Project, ProjectMembership, Task, Comment, TimeEntry
from api.serializers import ProjectSerializer, TaskSerializer, CommentSerializer, TimeEntrySerializer
from api.permissions import IsAdminUserRole
from rest_framework.views import APIView
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_str, force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from rest_framework.generics import CreateAPIView
# # Create your views here.

# class RegisterAPIView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         serializer = RegisterSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
    
class RegisterAPIView(CreateAPIView):  # Changed from APIView to CreateAPIView
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "User registered successfully"},
            status=status.HTTP_201_CREATED
        )

class AssignUserRoleAPIView(APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        role = request.data.get("role")

        if role not in User.RoleChoices.values:
            return Response({"error": "Invalid role"}, status=400)
        
        user.user_role = role
        user.save()

        return Response({"message": f"Role updated to {role}"})
    
class ForgotPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        user = User.objects.filter(email=email).first()

        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = f"http://frontend/reset-password/{uid}/token/"

        send_mail(
            "Password Reset",
            f"Click to reset your password: {reset_link}",
            "no-reply@example.com",
            [email]
        )

        return Response({"message": "Password reset email sent"}, status=status.HTTP_200_OK)
    
class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, uidb64, token):
        password = request.data.get("password")

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except:
            return Response({"error": "Invalid link"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(password)
        user.save()

        return Response({"message": "Password reset successful"})
        
    
class StoreProjectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(created_by=request.user)

            ProjectMembership.objects.create(user=request.user, project=project, role_in_project="Manager")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
class GetProjectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = Project.objects.all()
        serializer = ProjectSerializer(projects, many=True)
        return Response({
            'total_projects': projects.count(),
            'projects': serializer.data,
        })
    
class GetProjectMembershipAPIView(APIView):
    def get(self, request):
        project_membership = ProjectMembership.objects.exclude(role_in_project="Member")
        role = ProjectMembership.role_in_project
        serializer = ProjectSerializer({
            'Project Membership': project_membership,
            'role': role
        })
        return Response(serializer.data)
    
class TimeEntryViewSet(viewsets.ModelViewSet):
    queryset = TimeEntry.objects.all()
    serializer_class = TimeEntrySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['task', 'billable', 'user']
    ordering_fields = ['task', 'billable']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    
# class LogoutVIew(APIView):
#     def post(self, request):
#         try:
#             refresh_token = request.data["refresh"]
#             token = RefreshToken(refresh_token)
#             token.blacklist()
#             return Response({"message": "Logged out successfully"})
#         except:
#             return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
        
class TasksViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['status', 'description', 'priority']
    ordering_fields = ['status', 'priority']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    # def list(self, request):
    #     queryset = Task.objects.all()
    #     serializer_class = TaskSerializer(queryset, many=True)
    #     permission_classes = [IsAuthenticated]
    #     return Response(serializer_class.data)




# class UserViewSet(viewsets.ModelViewSet):
#     def list(self, request):
#         queryset = User.objects.all()
#         serializer_class = UserSerializer(queryset, many=True)
#         return Response(serializer_class.data)
