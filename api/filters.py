import django_filters
from api.models import TimeEntry

class TimeEntryFilter(django_filters.FilterSet):
    project = django_filters.NumberFilter(field_name="task__project__id")
    task = django_filters.NumberFilter(field_name="task__id")
    user = django_filters.NumberFilter(field_name="user__id")
    billable = django_filters.BooleanFilter(field_name="billable")

    from_date = django_filters.DateTimeFilter(field_name="start_time", lookup_expr="gte")
    to_date = django_filters.DateTimeFilter(field_name="end_time", lookup_expr="lte")

    class Meta:
        model = TimeEntry
        fields = ["project", "task", "user", "billable", "from_date", "to_date"]