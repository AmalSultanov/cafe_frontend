import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Calendar, Edit, Save, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    phone_number: user?.phone_number || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEditClick = () => {
    setIsEditing(true);
    setFormData({
      name: user?.name || '',
      surname: user?.surname || '',
      phone_number: user?.phone_number || ''
    });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      surname: user?.surname || '',
      phone_number: user?.phone_number || ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\d+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Phone number must contain only digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validateForm()) return;

    try {
      setIsLoading(true);

      const changedFields: Record<string, string> = {};
      if (formData.name !== user.name) changedFields.name = formData.name;
      if (formData.surname !== user.surname) changedFields.surname = formData.surname;
      if (formData.phone_number !== user.phone_number) changedFields.phone_number = formData.phone_number;

      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await axios.patch(
        `http://localhost:8000/api/v1/users/${user.id}`,
        changedFields,
        { withCredentials: true }
      );

      const updatedUser = response.data;
      updateUser(updatedUser);

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const message = error.response?.data?.detail || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <User className="text-yellow-600" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your account information</p>
            </div>
          </div>

          <div className="flex space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={isLoading}
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  <Save size={16} className="mr-2" />
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              {isEditing ? (
                <div>
                  <div className="flex items-center">
                    <User size={20} className="text-gray-400 mr-3 absolute ml-3 z-10" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your first name"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <User size={20} className="text-gray-400 mr-3" />
                  <span className="text-gray-900">{user.name || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surname
              </label>
              {isEditing ? (
                <div>
                  <div className="flex items-center">
                    <User size={20} className="text-gray-400 mr-3 absolute ml-3 z-10" />
                    <input
                      type="text"
                      value={formData.surname}
                      onChange={(e) => handleInputChange('surname', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                        errors.surname ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your last name"
                    />
                  </div>
                  {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
                </div>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <User size={20} className="text-gray-400 mr-3" />
                  <span className="text-gray-900">{user.surname || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <div>
                <div className="flex items-center">
                  <Phone size={20} className="text-gray-400 mr-3 absolute ml-3 z-10" />
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      errors.phone_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
              </div>
            ) : (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Phone size={20} className="text-gray-400 mr-3" />
                <span className="text-gray-900">+{user.phone_number}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Calendar size={20} className="text-gray-400 mr-3" />
              <span className="text-gray-900">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
