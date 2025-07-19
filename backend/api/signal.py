from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import User, UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


# Add WebSocket notification for User updates
@receiver(post_save, sender=User)
def user_update_notification(sender, instance, **kwargs):
    """Send WebSocket notification when user details change"""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        print("Channel layer not available")
        return

    try:
        # Get the user's profile and avatar URL
        profile = instance.profile
        avatar_url = None
        if hasattr(profile, 'avatar') and profile.avatar:
            avatar_url = profile.avatar.url

        # Include ALL user and profile data in the message
        print(f"Sending comprehensive update for user {instance.id}")
        async_to_sync(channel_layer.group_send)(
            f'profile_{instance.id}',
            {
                'type': 'profile_update',
                'username': instance.username,
                'email': instance.email,
                'avatar_url': avatar_url,
                'location': profile.location if hasattr(profile, 'location') else None,
                'has_completed_onboarding': profile.has_completed_onboarding if hasattr(profile,
                                                                                        'has_completed_onboarding') else False,
                'user_id': str(instance.id),
                'update_type': 'user_details'
            }
        )
        print(f"✅ Comprehensive WebSocket message sent for user {instance.id}")
    except Exception as e:
        print(f"❌ Error sending WebSocket notification: {str(e)}")
        import traceback
        traceback.print_exc()

# Add WebSocket notification for UserProfile updates
@receiver(post_save, sender=UserProfile)
def profile_update_notification(sender, instance, **kwargs):
    """Send WebSocket notification when profile details change"""
    channel_layer = get_channel_layer()

    # Generate avatar URL or None
    avatar_url = instance.avatar.url if instance.avatar else None

    async_to_sync(channel_layer.group_send)(
        f'profile_{instance.user.id}',
        {
            'type': 'profile_update',
            'avatar_url': avatar_url,
            'location': instance.location,
            'has_completed_onboarding': instance.has_completed_onboarding,
            'update_type': 'profile_details'
        }
    )
