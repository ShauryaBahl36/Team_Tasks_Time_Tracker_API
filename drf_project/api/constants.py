ROLE_PERMISSIONS = {
    "Admin": [
        "list_users",
        "role_assign",
        "create_project",
        "assign_members",
        "archive_reactivate_projects",
        "update_tasks",
        "view_project_timesheet_summary",
        "weekly_summary",
    ],
    "Manager": [
        "create_project",
        "assign_members",
        "update_tasks",
        "weekly_summary",
    ],
    "Member": [
        "update_tasks"
    ],
}