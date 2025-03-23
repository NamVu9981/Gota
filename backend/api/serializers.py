from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth import authenticate

User=get_user_model()

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
    def validate_email(self, value):
        """Check if the email already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists. Please log in instead.")
        return value
    def validate_username(self, value):
        """Check if the username already exists."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken. Please choose a different one.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No such user")
        if not user.check_password(password):
            raise serializers.ValidationError("Incorrect password")
        if user and user.is_active:
            return {
                'user': user
            }
        raise serializers.ValidationError("No such user")