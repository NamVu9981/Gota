from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class FriendShip(models.Model):
    from_user = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)

    STATUS_CHOICES = [
       ('pending', 'Pending'),
       ('accepted', 'Accepted'),
       ('rejected', 'Rejected'),
    ] 
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('from_user', 'to_user')
        indexes = [
            models.Index(fields=['from_user', 'status']),
            models.Index(fields=['to_user', 'status']),
        ]
        def __str__(self):
            return f"{self.from_user.username} -> {self.to_user.username} ({self.status})"

# Create your models here.
