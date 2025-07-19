# # consumers.py
# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from django.contrib.auth import get_user_model

# User = get_user_model()


# class BaseConsumer(AsyncWebsocketConsumer):
#     """Base consumer with common functionality"""

#     async def connect(self):
#         """Handle connection setup - to be extended by subclasses"""
#         await self.accept()

#     async def disconnect(self, close_code):
#         """Handle disconnection - to be extended by subclasses"""
#         pass

#     async def send_json(self, content):
#         """Helper to send JSON content"""
#         await self.send(text_data=json.dumps(content))


# class BaseUserConsumer(BaseConsumer):
#     """Base consumer for all user-specific features"""

#     async def connect(self):
#         """Connect to the appropriate user group"""
#         # Extract user_id from URL route
#         self.user_id = self.scope['url_route']['kwargs']['user_id']

#         # Form group name using prefix defined in subclass
#         self.room_group_name = f'{self.group_name_prefix}_{self.user_id}'

#         # Join room group
#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )

#         # IMPORTANT: Call accept AFTER joining the group
#         await self.accept()

#     async def disconnect(self, close_code):
#         """Leave the user group when disconnecting"""
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )

#     @database_sync_to_async
#     def get_user(self):
#         """Helper method to get user from database"""
#         try:
#             return User.objects.get(id=self.user_id)
#         except User.DoesNotExist:
#             return None

#     # Add a receive method to handle client messages
#     async def receive(self, text_data):
#         """Handle messages from the client"""
#         try:
#             text_data_json = json.loads(text_data)
#             action = text_data_json.get('action')

#             if action == 'ping':
#                 # Respond to ping with a pong
#                 await self.send_json({'action': 'pong'})
#         except json.JSONDecodeError:
#             pass


# class ProfileConsumer(BaseUserConsumer):
#     """Consumer for profile updates with selective field updates"""
#     group_name_prefix = 'profile'

#     async def connect(self):
#         """Connect and send initial profile data"""
#         try:
#             self.user_id = self.scope['url_route']['kwargs']['user_id']
#             self.room_group_name = f'profile_{self.user_id}'

#             await self.channel_layer.group_add(
#                 self.room_group_name,
#                 self.channel_name
#             )

#             await self.accept()
#             print(f"✅ WebSocket connection accepted for user {self.user_id}")

#             # Send initial complete profile data
#             user = await self.get_user()
#             if user:
#                 profile = await self.get_profile(user)
#                 await self.send_initial_profile_data(user, profile)
#             else:
#                 await self.close()
                
#         except Exception as e:
#             print(f"❌ Error in connect: {str(e)}")
#             await self.close()

#     async def receive(self, text_data):
#         """Handle messages from the client for field-specific updates"""
#         try:
#             data = json.loads(text_data)
#             action = data.get('action')

#             if action == 'update_field':
#                 await self.handle_field_update(data)
#             elif action == 'update_multiple_fields':
#                 await self.handle_multiple_field_update(data)
#             elif action == 'ping':
#                 await self.send_json({'action': 'pong'})
#         except json.JSONDecodeError:
#             await self.send_json({'error': 'Invalid JSON'})
#         except Exception as e:
#             print(f"❌ Error in receive: {str(e)}")
#             await self.send_json({'error': 'Server error'})

#     async def handle_field_update(self, data):
#         """Handle single field update"""
#         field_name = data.get('field')
#         field_value = data.get('value')
        
#         if not field_name:
#             await self.send_json({'error': 'Field name is required'})
#             return

#         try:
#             user = await self.get_user()
#             if not user:
#                 await self.send_json({'error': 'User not found'})
#                 return

#             # Update the specific field
#             success = await self.update_user_field(user, field_name, field_value)
            
#             if success:
#                 # Send only the updated field back to the client
#                 response = {
#                     'action': 'field_updated',
#                     'field': field_name,
#                     'value': field_value,
#                     'user_id': str(user.id)
#                 }
                
#                 # For avatar updates, include the URL
#                 if field_name == 'avatar' and field_value:
#                     profile = await self.get_profile(user)
#                     if profile and profile.avatar:
#                         response['avatar_url'] = profile.avatar.url

#                 await self.send_json(response)
                
#                 # Broadcast to other connections for this user
#                 await self.channel_layer.group_send(
#                     self.room_group_name,
#                     {
#                         'type': 'field_update_broadcast',
#                         **response
#                     }
#                 )
#             else:
#                 await self.send_json({'error': f'Failed to update {field_name}'})
                
#         except Exception as e:
#             print(f"❌ Error updating field {field_name}: {str(e)}")
#             await self.send_json({'error': f'Failed to update {field_name}'})

#     async def handle_multiple_field_update(self, data):
#         """Handle multiple field updates"""
#         fields = data.get('fields', {})
        
#         if not fields:
#             await self.send_json({'error': 'No fields provided'})
#             return

#         try:
#             user = await self.get_user()
#             if not user:
#                 await self.send_json({'error': 'User not found'})
#                 return

#             updated_fields = {}
#             failed_fields = []

#             # Update each field
#             for field_name, field_value in fields.items():
#                 success = await self.update_user_field(user, field_name, field_value)
#                 if success:
#                     updated_fields[field_name] = field_value
#                 else:
#                     failed_fields.append(field_name)

#             # Prepare response
#             response = {
#                 'action': 'multiple_fields_updated',
#                 'updated_fields': updated_fields,
#                 'failed_fields': failed_fields,
#                 'user_id': str(user.id)
#             }

#             # Include avatar URL if avatar was updated
#             if 'avatar' in updated_fields:
#                 profile = await self.get_profile(user)
#                 if profile and profile.avatar:
#                     response['avatar_url'] = profile.avatar.url

#             await self.send_json(response)
            
#             # Broadcast to other connections
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'multiple_fields_update_broadcast',
#                     **response
#                 }
#             )
                
#         except Exception as e:
#             print(f"❌ Error updating multiple fields: {str(e)}")
#             await self.send_json({'error': 'Failed to update fields'})

#     @database_sync_to_async
#     def update_user_field(self, user, field_name, field_value):
#         """Update a specific field in User or Profile model"""
#         try:
#             # User model fields
#             user_fields = ['username', 'email', 'first_name', 'last_name']
#             # Profile model fields
#             profile_fields = ['avatar', 'location', 'has_completed_onboarding', 'bio', 'phone']

#             if field_name in user_fields:
#                 # Update User model
#                 setattr(user, field_name, field_value)
#                 user.save(update_fields=[field_name])
#                 print(f"✅ Updated user.{field_name} = {field_value}")
#                 return True
                
#             elif field_name in profile_fields:
#                 # Update Profile model
#                 profile, created = user.profile, False
#                 if not profile:
#                     # Create profile if it doesn't exist
#                     from api.models import Profile  # Replace with your actual import
#                     profile = Profile.objects.create(user=user)
                    
#                 setattr(profile, field_name, field_value)
#                 profile.save(update_fields=[field_name])
#                 print(f"✅ Updated profile.{field_name} = {field_value}")
#                 return True
#             else:
#                 print(f"❌ Unknown field: {field_name}")
#                 return False
                
#         except Exception as e:
#             print(f"❌ Error updating {field_name}: {str(e)}")
#             return False

#     async def field_update_broadcast(self, event):
#         """Broadcast single field update to other connections"""
#         # Remove the 'type' field before sending
#         message = {k: v for k, v in event.items() if k != 'type'}
#         await self.send_json(message)

#     async def multiple_fields_update_broadcast(self, event):
#         """Broadcast multiple field updates to other connections"""
#         # Remove the 'type' field before sending
#         message = {k: v for k, v in event.items() if k != 'type'}
#         await self.send_json(message)

#     # Keep your existing methods
#     @database_sync_to_async
#     def get_user(self):
#         """Helper method to get user from database"""
#         try:
#             return User.objects.select_related('profile').get(id=self.user_id)
#         except User.DoesNotExist:
#             return None

#     @database_sync_to_async
#     def get_profile(self, user):
#         """Helper method to get profile from database"""
#         try:
#             return getattr(user, 'profile', None)
#         except Exception as e:
#             print(f"❌ Error getting profile: {str(e)}")
#             return None

#     @database_sync_to_async
#     def get_profile_data(self, user, profile):
#         """Get complete profile data"""
#         avatar_url = None
#         if profile and profile.avatar:
#             try:
#                 avatar_url = profile.avatar.url
#             except Exception as e:
#                 print(f"❌ Error getting avatar URL: {str(e)}")
        
#         return {
#             'username': user.username,
#             'email': user.email,
#             'first_name': user.first_name,
#             'last_name': user.last_name,
#             'avatar_url': avatar_url,
#             'location': profile.location if profile else None,
#             'has_completed_onboarding': profile.has_completed_onboarding if profile else False,
#             'bio': getattr(profile, 'bio', None) if profile else None,
#             'phone': getattr(profile, 'phone', None) if profile else None,
#             'user_id': str(user.id),
#         }

#     async def send_initial_profile_data(self, user, profile):
#         """Send complete initial profile data when client connects"""
#         try:
#             profile_data = await self.get_profile_data(user, profile)
#             profile_data['action'] = 'initial_data'
#             await self.send_json(profile_data)
#             print(f"✅ Sent initial profile data for user {self.user_id}")
#         except Exception as e:
#             print(f"❌ Error sending initial profile data: {str(e)}")

#     # Handle external updates (from views/signals)
#     async def profile_update(self, event):
#         """Handle profile update messages from external sources"""
#         try:
#             message = {k: v for k, v in event.items() if k != 'type'}
#             await self.send_json(message)
#         except Exception as e:
#             print(f"❌ ERROR in profile_update: {str(e)}")
            

# your_app/consumers.py
# consumers.py
# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class UsernameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get user ID from URL
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'user_{self.user_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()
        print(f"✅ User {self.user_id} connected to WebSocket")

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"❌ User {self.user_id} disconnected from WebSocket")

    # Receive message from WebSocket (from frontend)
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action == 'update_username':
                new_username = data.get('username')
                
                # Update username in database
                success = await self.update_username(new_username)
                
                if success:
                    # Broadcast to all connections for this user
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'username_updated',
                            'username': new_username,
                            'success': True
                        }
                    )
                    print(f"✅ Username updated to: {new_username}")
                else:
                    # Send error back to client
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Failed to update username'
                    }))
                    
        except Exception as e:
            print(f"❌ Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid request'
            }))

    # Receive message from room group (broadcast to other tabs/devices)
    async def username_updated(self, event):
        username = event['username']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'username_updated',
            'username': username,
            'success': True
        }))

    @database_sync_to_async
    def update_username(self, new_username):
        try:
            user = User.objects.get(id=self.user_id)
            user.username = new_username
            user.save()
            return True
        except User.DoesNotExist:
            print(f"❌ User {self.user_id} not found")
            return False
        except Exception as e:
            print(f"❌ Error updating username: {str(e)}")
            return False