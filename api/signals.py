from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Permission
from .models import User
from .constants import ROLE_PERMISSIONS

@receiver(post_save, sender=User)
def assign_permissions_by_role(sender, instance, **kwargs):
    instance.user_permissions.clear()

    if instance.user_role == User.RoleChoices.ADMIN:
        instance.is_staff = True
        instance.is_superuser = True
        instance.save(update_fields=["is_staff", "is_superuser"])
        return
    
    perms = ROLE_PERMISSIONS.get(instance.user_role, [])
    permissions = Permission.objects.filter(codename__in=perms)
    instance.user_permissions.set(permissions)