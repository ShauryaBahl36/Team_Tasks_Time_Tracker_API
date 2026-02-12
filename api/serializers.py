from api.models import User, Project, ProjectMembership, Task, Comment, TimeEntry
from rest_framework import serializers



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

class ProjectSerializer(serializers.ModelSerializer):
    is_archived = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", 
            "name", 
            "code", 
            "description", 
            "archived_at", 
            "created_by", 
            "is_archived"
        ]
        read_only_fields = ["created_by", "archived_at"]

    def get_is_archived(self, obj):
        return obj.archived_at is not None

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
    class Meta:
        model = Comment
        fields = '__all__'

class TimeEntrySerializer(serializers.ModelSerializer):
    timeline = serializers.DurationField(read_only=True)
    class Meta:
        model = TimeEntry
        fields = (
            'id',
            'task',
            'user',
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



