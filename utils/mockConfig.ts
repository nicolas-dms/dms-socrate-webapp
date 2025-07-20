// Development configuration
// Set MOCK_APIS to true to enable mock responses for development/demo purposes
export const config = {
  MOCK_APIS: true, // Set to false when connecting to real backend
  MOCK_USER: {
    user_id: "mock-user-123",
    email: "demo@exominutes.com",
    username: "Demo User",
    profile_picture: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  MOCK_CREDITS: {
    current_balance: 150,
    total_purchased: 200,
    total_used: 50
  },
  MOCK_PREFERENCES: {
    default_level: 'intermediate' as const,
    default_study_time: '60min' as const
  }
};
