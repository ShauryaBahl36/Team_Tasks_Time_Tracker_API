from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Project, Task, TimeEntry, ProjectMembership
from datetime import date, timedelta

User = get_user_model()


class BaseAPITestCase(APITestCase):

    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_user(
            username="admin",
            password="admin123",
            is_staff=True
        )

        self.user1 = User.objects.create_user(
            username="user1",
            password="test123"
        )

        self.user2 = User.objects.create_user(
            username="user2",
            password="test123"
        )

        # Project
        self.project = Project.objects.create(
            name="Test Project",
            code="TP01",
            description="Test Desc",
            created_by=self.admin
        )

        # Memberships
        ProjectMembership.objects.create(
            user=self.user1,
            project=self.project,
            role_in_project="Member"
        )

        ProjectMembership.objects.create(
            user=self.admin,
            project=self.project,
            role_in_project="Manager"
        )

        # Task
        self.task = Task.objects.create(
            project=self.project,
            title="Test Task",
            description="Task Desc",
            priority="Low",
            status="To-Do",
            created_by=self.admin,
            assigned_to=self.user1,
            due_date=date.today() + timedelta(days=7),
            estimate_hours=10.0
        )

        # Time Entry (belongs to user1)
        self.time_entry = TimeEntry.objects.create(
            task=self.task,
            user=self.user1,
            start_time="2026-02-20T10:00:00Z",
            end_time="2026-02-20T12:00:00Z",
            billable=True
        )


# ---------------- PROJECT TESTS ---------------- #

class ProjectTests(BaseAPITestCase):

    def test_admin_can_create_project(self):
        self.client.force_authenticate(user=self.admin)

        data = {
            "name": "New Project",
            "code": "NP01",
            "description": "New Desc"
        }

        response = self.client.post("/url/projects/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_member_cannot_create_project(self):
        self.client.force_authenticate(user=self.user1)

        data = {
            "name": "Invalid Project",
            "code": "INV01",
            "description": "Should Fail"
        }

        response = self.client.post("/url/projects/", data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------- TASK TESTS ---------------- #

class TaskTests(BaseAPITestCase):

    def test_member_can_view_tasks(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get("/url/tasks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_member_cannot_create_task(self):
        self.client.force_authenticate(user=self.user2)

        data = {
            "project": self.project.id,
            "title": "Unauthorized Task",
            "description": "Should Fail",
            "priority": "Low",
            "status": "To-Do",
            "assigned_to": self.user1.id,
            "due_date": str(date.today() + timedelta(days=5)),
            "estimate_hours": 5.0
        }

        response = self.client.post("/url/tasks/", data)

        # If project membership filtering hides it → 403
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------- TIME ENTRY TESTS ---------------- #

class TimeEntryTests(BaseAPITestCase):

    def test_user_can_view_own_time_entry(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get("/url/time-entries/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_user_cannot_view_others_time_entry(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.get("/url/time-entries/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user2 should see nothing
        self.assertEqual(len(response.data["results"]), 0)

    def test_admin_can_view_all_time_entries(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/url/time-entries/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_user_cannot_delete_others_entry(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.delete(
            f"/url/time-entries/{self.time_entry.id}/"
        )

        # Secure design → hidden resource
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_delete_own_entry(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.delete(
            f"/url/time-entries/{self.time_entry.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)