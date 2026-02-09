from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
# Create your models here.


class User(AbstractUser):
    class RoleChoices(models.TextChoices):
        ADMIN = 'Admin'
        MANAGER = 'Manager'
        MEMBER = 'Member'
    name = models.CharField(max_length=30)
    avatar_url = models.URLField(blank=True, null=True)
    timezone = models.CharField(max_length=100)
    user_role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.MEMBER)

    class Meta:
        permissions = [
            ('list_users', 'Listing of Users'),
            ('role_assign', 'Assigning of roles'),
            ('create_project', 'Creation of projects'),
            ('assign_members', 'Assigning of Members'),
            ('archive_reactivate_projects', 'Archiving/Reactivation of Projects'),
            ('update_tasks', 'Update the respective tasks'),
            ('view_project_timesheet_summary', 'Viewing of Project Timesheet Summary'),
            ('weekly_summary', 'Weekly Summary Report per Project')
        ]

    def __str__(self):
        return self.username

class Project(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    description = models.TextField()
    archived_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_projects", null=True, blank=True)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

class ProjectMembership(models.Model):
    class RoleChoices(models.TextChoices):
        MANAGER = 'Manager'
        MEMBER = 'Member'
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    role_in_project = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.MEMBER)

class Task(models.Model):
    class StatusChoices(models.TextChoices):
        TODO = 'To-Do'
        IN_PROGRESS = 'In-Progress'
        DONE = 'Done'
    class PriorityChoices(models.TextChoices):
        LOW = 'Low'
        MEDIUM = 'Medium'
        HIGH = 'High'
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PriorityChoices.choices, default=PriorityChoices.LOW)
    status = models.CharField(max_length=30, choices=StatusChoices.choices, default=StatusChoices.TODO)
    due_date = models.DateField()
    estimate_hours = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_tasks")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)

    @property
    def days_left(self) -> int:
        days = (self.due_date - timezone.now().date()).days
        return max(days, 0)
    
    def __str__(self):
        return self.title

class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class TimeEntry(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField()
    billable = models.BooleanField(default=True)

    @property
    def timeline(self) -> bool:
        if self.end_time is None:
            return False
        return self.end_time - self.start_time