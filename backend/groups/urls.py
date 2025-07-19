# groups/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Group CRUD operations
    path('', views.list_groups, name='list_groups'),                   
    path('create/', views.create_group, name='create_group'),          
    path('<uuid:group_id>/', views.get_group_details, name='group_details'),  
    path('<uuid:group_id>/update/', views.update_group, name='update_group'),  
    path('<uuid:group_id>/delete/', views.delete_group, name='delete_group'),  
    
    # Member management
    path('<uuid:group_id>/add-members/', views.add_members_to_group, name='add_members'),    
    path('<uuid:group_id>/remove-member/', views.remove_member_from_group, name='remove_member'),  
    path('<uuid:group_id>/members/', views.get_group_members, name='group_members'),          
    
    # Location sharing
    path('<uuid:group_id>/location-sharing/', views.update_location_sharing, name='location_sharing'),  
    
    # Invitations
    path('invitations/', views.get_group_invitations, name='group_invitations'),              
    path('invitations/<uuid:invitation_id>/respond/', views.respond_to_invitation, name='respond_invitation'),  
    path('<uuid:group_id>/invite/', views.invite_to_group, name='invite_to_group'),         
]

# This creates these endpoints:
# GET    /api/groups/                     - List user's groups
# POST   /api/groups/create/              - Create new group
# GET    /api/groups/{id}/                - Get group details with members
# PATCH  /api/groups/{id}/update/         - Update group
# DELETE /api/groups/{id}/delete/         - Delete group (soft delete)
# POST   /api/groups/{id}/add-members/    - Add members to group
# POST   /api/groups/{id}/remove-member/  - Remove member from group
# GET    /api/groups/{id}/members/        - Get group members
# POST   /api/groups/{id}/location-sharing/ - Update location sharing preference
# GET    /api/groups/invitations/         - Get pending invitations
# POST   /api/groups/invitations/{id}/respond/ - Accept/decline invitation
# POST   /api/groups/{id}/invite/         - Send group invitations