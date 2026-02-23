from api.models import User, Project, ProjectMembership, Task, Comment, TimeEntry, Notification, BulkUploadReport
from rest_framework import serializers
import re

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user
    
class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_staff",
            "is_active",
            "date_joined"
        ]


class ProjectSerializer(serializers.ModelSerializer):
    is_archived = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", 
            "name", 
            "code", 
            "description", 
            "archived_at", 
            "created_by", 
            "is_archived",
            "my_role"
        ]
        read_only_fields = ["created_by", "archived_at"]

    def get_is_archived(self, obj):
        return obj.archived_at is not None
    
    def get_my_role(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return None
        
        membership = ProjectMembership.objects.filter(
            user=request.user,
            project=obj
        ).first()

        if membership:
            return membership.role_in_project
        
        return None

    def update(self, instance, validated_data):
        if instance.archived_at is not None:
            if "archived_at" in validated_data and validated_data["archived_at"] is None:
                instance.archived_at = None
                instance.save()
                return instance
            raise serializers.ValidationError("Archived project cannot be edited (only reactivation allowed).")
        return super().update(instance, validated_data)

class ProjectMembershipSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    class Meta:
        model = ProjectMembership
        fields = [
            "id", 
            "user", 
            "user_username", 
            "project", 
            "role_in_project"
        ]

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = (
            'id',
            'project',
            'title',
            'description',
            'priority',
            'status',
            'due_date',
            'estimate_hours',
            'created_by',
            'assigned_to',
            'tags',
            'days_left'
        )
        read_only_fields = ['created_by']

    def validate(self, data):
        request = self.context['request']
        user = request.user
        project = data.get("project")
        instance = getattr(self, "instance", None)

        if instance:
            old_status = instance.status
            new_status = data.get("status", old_status)

            allowed_flow = {
                "To-Do": ["In-Progress"],
                "In-Progress": ["Done"],
                "Done": []
            }

            if new_status != old_status:
                is_manager = ProjectMembership.objects.filter(user=user, project=instance.project, role_in_project="Manager").exists()

                if not is_manager:
                    if new_status not in allowed_flow.get(old_status, []):
                        raise serializers.ValidationError(
                            f"Invalid status change {old_status} -> {new_status}. only managers can skip."
                        )

        is_member = ProjectMembership.objects.filter(user=user, project=project).exists()
        if not is_member:
            raise serializers.ValidationError("You are not a member of this project, cannot create task")
        return data

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "task", "author", "author_username", "body", "created_at"]
        read_only_fields = ["author", "created_at", "task"]

    def create(self, validated_data):
        comment = Comment.objects.create(
            **validated_data
        )

        # Parse @mentions
        mentioned_usernames = re.findall(r"@(\w+)", comment.body)

        for username in mentioned_usernames:
            try:
                mentioned_user = User.objects.get(username=username)

                # Create notification
                Notification.objects.create(
                    recipient=mentioned_user,
                    sender=comment.author,
                    task=comment.task,
                    comment=comment,
                    message=f"{comment.author.username} mentioned you in a comment"
                )

            except User.DoesNotExist:
                continue

        return comment

class TimeEntrySerializer(serializers.ModelSerializer):
    timeline = serializers.DurationField(read_only=True)
    project_name = serializers.CharField(source="task.project.name", read_only=True)
    task_title = serializers.CharField(source="task.title", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    class Meta:
        model = TimeEntry
        fields = (
            'id',
            'task',
            "task_title",
            "project_name",
            'user',
            "username",
            'start_time',
            'end_time',
            'notes',
            'billable',
            'timeline'
        )
        read_only_fields = ['user']

    def validate(self, data):
        request = self.context['request']
        user = request.user
        task = data.get("task") or getattr(self.instance, "task", None)
        start = data.get("start_time") or getattr(self.instance, "start_time", None)
        end = data.get("end_time") or getattr(self.instance, "end_time", None)

        if end and end <= start:
            raise serializers.ValidationError("End time must be greater than start time")

        if task:
            is_member = ProjectMembership.objects.filter(user=user, project=task.project).exists()

            if not is_member:
                raise serializers.ValidationError("You are not a member of this project, cannot log time.")
        return data

class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source="sender.username")

    class Meta:
        model = Notification
        fields = [
            "id",
            "sender",
            "sender_username",
            "task",
            "comment",
            "message",
            "is_read",
            "created_at"
        ]
        read_only_fields = ["sender", "created_at"]

class BulkUploadReportSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.ReadOnlyField(source="uploaded_by.username")

    class Meta:
        model = BulkUploadReport
        fields = "__all__"
