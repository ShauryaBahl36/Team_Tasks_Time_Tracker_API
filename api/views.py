from django.shortcuts import render, get_object_or_404
from api.serializers import RegisterSerializer
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, DjangoModelPermissions, AllowAny
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from api.models import User, Project, ProjectMembership, Task, Comment, TimeEntry
from api.serializers import ProjectSerializer, TaskSerializer, CommentSerializer, TimeEntrySerializer
from api.permissions import IsAdminUserRole, IsOwnerOrProjectManager, IsProjectManagerOrAdmin
from api.filters import TimeEntryFilter
from rest_framework.views import APIView
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_str, force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from rest_framework.generics import CreateAPIView
from django.utils.timezone import now
from django.db.models import Sum, F, ExpressionWrapper, DurationField
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
    
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin sees all
        if user.is_staff:
            return Project.objects.all()
        
        # Member sees only projects they belong to
        return Project.objects.filter(
            projectmembership__user=user
        ).distinct()
    
    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)

        # creator becomes Manager automatically
        ProjectMembership.objects.create(
            user=self.request.user,
            project=project,
            role_in_project="Manager"
        )

    def update(self, request, *args, **kwargs):
        project = self.get_object()

        # prevent editing archived projects
        if project.archived_at is not None:
            return Response(
                {"error": "Archived project canot be edited. Reactivate first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        project = self.get_object()

        # prevent editing archived projects
        if project.archived_at is not None:
            return Response(
                {"error": "Archived project cannot be edited. Reactivate first. "},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().partial_update(request, *args, **kwargs)
    
    def get_permissions(self):
        if self.action in ["create"]:
            return [IsAuthenticated()]
        
        if self.action in ["update", "partial_update", "archive", "reactivate", "members", "timesheet_summary"]:
            return [IsAuthenticated(), IsProjectManagerOrAdmin()]
        
        return [IsAuthenticated()]
    
    @action(detail=True, methods=["POST"])
    def archive(self, request, pk=None):
        project = self.get_object()

        if project.archived_at is not None:
            return Response(
                {
                    "message": "Project already archived"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project.archived_at = now()
        project.save()

        return Response(
            {
                "message": "Project archived successfully"
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=["POST"])
    def reactivate(self, request, pk=None):
        project = self.get_object()

        if project.archived_at is None:
            return Response(
                {
                    "message": "Project is already active"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        project.archived_at = None
        project.save()

        return Response(
            {
                "message": "Project reactivated successfully"
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=["POST"])
    def members(self, request, pk=None):
        project = self.get_object()

        user_id = request.data.get("user_id")
        action_type = request.data.get("action")
        role = request.data.get("role", "Member")

        if not user_id or not action_type:
            return Response(
                {
                    "error": "user_id and action are required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action_type == "add":
            membership, created = ProjectMembership.objects.get_or_create(
                user_id=user_id,
                project=project,
                defaults={"role_in_project": role}
            )

            if not created:
                membership.role_in_project = role
                membership.save()

            return Response(
                {
                    "message": "Member added/updated successfully"
                },
                status=status.HTTP_200_OK
            )
        elif action_type == "remove":
            ProjectMembership.objects.filter(user_id=user_id, project=project).delete()
            return Response(
                {
                    "error": "Invalid action. Use add/remove"
                },
                status=status.HTTP_200_OK
            )
        
        @action(detail=True, methods=["GET"], url_path="timesheet/summary")
        def timesheet_summary(self, request, pk=None):
            project = self.get_object()

            from_date = request.query_params.get("from")
            to_date = request.query_params.get("to")

            if not from_date or not to_date:
                return Response(
                    {
                        "error": "from and to query params are required"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            entries = TimeEntry.objects.filter(
                task__project=project,
                start_time__date__gte=from_date,
                start_time__date__lte=to_date
            )

            duration_expr = ExpressionWrapper(
                F("end_time") - F("start_time"),
                output_field=DurationField()
            )

            total_duration = entries.annotate(
                duration=duration_expr
            ).aggregate(total=Sum("duration"))["total"]

            billable_duration = entries.filter(billable=True).annotate(
                duration=duration_expr
            ).aggregate(total=Sum("duration"))["total"]

            return Response(
                {
                    "project_id": project.id,
                    "project_name": project.name,
                    "from": from_date,
                    "to": to_date,
                    "total_logged_time": str(total_duration) if total_duration else "0:00:00",
                    "billable_time": str(billable_duration) if billable_duration else "0:00:00",
                    "total_entries": entries.count(),
                },
                status=200
            )


    
class TimeEntryViewSet(viewsets.ModelViewSet):
    # queryset = TimeEntry.objects.all()
    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrProjectManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TimeEntryFilter
    search_fields = ['task', 'billable', 'user']
    ordering_fields = ["start_time", "end_time", "billable"]
    ordering = ["-start_time"]

    def get_queryset(self):
        user = self.request.user

        return TimeEntry.objects.filter(
            task__project__projectmembership__user=user
        ).distinct()

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
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['status', 'description', 'priority']
    ordering_fields = ['status', 'priority']

    def get_queryset(self):
        return Task.objects.filter(assigned_to=self.request.user)

    @action(detail=True, methods=['POST'])
    def assign(self, request, pk=None):
        task = self.get_object()

        user_id = request.data.get("user_id")

        if not user_id:
            return Response(
                {"error": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        task.assigned_to = user
        task.save()

        return Response(
            {"message": f"Task assigned to {user.username}"}, status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['POST'])
    def transition(self, request, pk=None):
        task = self.get_object()

        new_status = request.data.get("status")
        if not new_status:
            return Response(
                {"error": "status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        allowed_transitions = {
            Task.StatusChoices.TODO: [Task.StatusChoices.IN_PROGRESS],
            Task.StatusChoices.IN_PROGRESS: [Task.StatusChoices.DONE],
            Task.StatusChoices.DONE: []
        }

        current_status = task.status

        if new_status not in allowed_transitions.get(current_status, []):
            return Response(
                {
                    "error": "Invalid status transition",
                    "current_status": current_status,
                    "allowed_next_transition": allowed_transitions.get(current_status, [])
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = new_status
        task.save()

        return Response(
            {
                "message": "Task status updated successfully",
                "old_status": current_status,
                "new_status": new_status
            },
            status=status.HTTP_200_OK
        )

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
