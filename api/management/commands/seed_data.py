from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from api.models import (
    User, Project, ProjectMembership, Task, Tag, TimeEntry, Comment
)

class Command(BaseCommand):
    help = "Seeds the database with test data"

    def handle(self, *args, **kwargs):

        # -------------------------
        # USERS
        # -------------------------
        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@test.com",
                "name": "Admin User",
                "timezone": "Asia/Kolkata",
                "user_role": "Admin",
                "is_staff": True,
                "is_superuser": True,
            }
        )
        admin.set_password("admin123")
        admin.save()

        manager, _ = User.objects.get_or_create(
            username="manager1",
            defaults={
                "email": "manager@test.com",
                "name": "Manager One",
                "timezone": "Asia/Kolkata",
                "user_role": "Manager",
                "is_staff": True,
            }
        )
        manager.set_password("manager123")
        manager.save()

        member, _ = User.objects.get_or_create(
            username="member1",
            defaults={
                "email": "member@test.com",
                "name": "Member One",
                "timezone": "Asia/Kolkata",
                "user_role": "Member",
            }
        )
        member.set_password("member123")
        member.save()

        outsider, _ = User.objects.get_or_create(
            username="outsider1",
            defaults={
                "email": "outsider@test.com",
                "name": "Outsider User",
                "timezone": "Asia/Kolkata",
                "user_role": "Member",
            }
        )
        outsider.set_password("outsider123")
        outsider.save()

        self.stdout.write(self.style.SUCCESS("Users created."))

        # -------------------------
        # PROJECTS
        # -------------------------
        project1, _ = Project.objects.get_or_create(
            code="PRJ001",
            defaults={
                "name": "Project Alpha",
                "description": "This is a test project for membership validation.",
                "created_by": manager,
            }
        )

        project2, _ = Project.objects.get_or_create(
            code="PRJ002",
            defaults={
                "name": "Project Beta",
                "description": "Second project used for outsider validation.",
                "created_by": admin,
            }
        )

        self.stdout.write(self.style.SUCCESS("Projects created."))

        # -------------------------
        # MEMBERSHIPS
        # -------------------------
        ProjectMembership.objects.get_or_create(
            user=manager,
            project=project1,
            defaults={"role_in_project": "Manager"}
        )

        ProjectMembership.objects.get_or_create(
            user=member,
            project=project1,
            defaults={"role_in_project": "Member"}
        )

        ProjectMembership.objects.get_or_create(
            user=admin,
            project=project2,
            defaults={"role_in_project": "Manager"}
        )

        self.stdout.write(self.style.SUCCESS("Project memberships created."))

        # -------------------------
        # TAGS
        # -------------------------
        tag_bug, _ = Tag.objects.get_or_create(name="bug")
        tag_feature, _ = Tag.objects.get_or_create(name="feature")
        tag_urgent, _ = Tag.objects.get_or_create(name="urgent")

        self.stdout.write(self.style.SUCCESS("Tags created."))

        # -------------------------
        # TASKS
        # -------------------------
        task1, _ = Task.objects.get_or_create(
            title="Fix Login Bug",
            project=project1,
            defaults={
                "description": "Fix login API issue for wrong password.",
                "priority": "High",
                "status": "To-Do",
                "due_date": timezone.now().date() + timedelta(days=7),
                "estimate_hours": 5.0,
                "created_by": manager,
                "assigned_to": member,
            }
        )
        task1.tags.set([tag_bug, tag_urgent])

        task2, _ = Task.objects.get_or_create(
            title="Add Dashboard UI",
            project=project1,
            defaults={
                "description": "Create dashboard page in frontend.",
                "priority": "Medium",
                "status": "In-Progress",
                "due_date": timezone.now().date() + timedelta(days=14),
                "estimate_hours": 12.0,
                "created_by": manager,
                "assigned_to": member,
            }
        )
        task2.tags.set([tag_feature])

        task3, _ = Task.objects.get_or_create(
            title="Setup CI/CD",
            project=project2,
            defaults={
                "description": "Add GitHub actions pipeline.",
                "priority": "Low",
                "status": "To-Do",
                "due_date": timezone.now().date() + timedelta(days=20),
                "estimate_hours": 8.0,
                "created_by": admin,
                "assigned_to": admin,
            }
        )

        self.stdout.write(self.style.SUCCESS("Tasks created."))

        # -------------------------
        # COMMENTS
        # -------------------------
        Comment.objects.get_or_create(
            task=task1,
            author=member,
            defaults={"body": "I will start working on this bug today."}
        )

        Comment.objects.get_or_create(
            task=task2,
            author=manager,
            defaults={"body": "Make sure the UI follows company theme."}
        )

        self.stdout.write(self.style.SUCCESS("Comments created."))

        # -------------------------
        # TIME ENTRIES
        # -------------------------
        TimeEntry.objects.get_or_create(
            task=task2,
            user=member,
            defaults={
                "start_time": timezone.now() - timedelta(hours=3),
                "end_time": timezone.now() - timedelta(hours=1),
                "notes": "Worked on dashboard layout and API integration.",
                "billable": True
            }
        )

        self.stdout.write(self.style.SUCCESS("Time entries created."))

        self.stdout.write(self.style.SUCCESS("✅ Database seeded successfully!"))