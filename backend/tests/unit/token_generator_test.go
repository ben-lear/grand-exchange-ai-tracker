package unit

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/guavi/osrs-ge-tracker/internal/utils"
)

// TestGenerateShareToken tests the generation of share tokens.
func TestGenerateShareToken(t *testing.T) {
	token, err := utils.GenerateShareToken()
	require.NoError(t, err)
	require.NotEmpty(t, token)

	// Check format: adjective-adjective-noun
	parts := strings.Split(token, "-")
	assert.Equal(t, 3, len(parts), "Token should have 3 parts")

	// Check each part is lowercase letters only
	for i, part := range parts {
		assert.NotEmpty(t, part, "Part %d should not be empty", i)
		for _, char := range part {
			assert.True(t, char >= 'a' && char <= 'z', "Part %d contains invalid character: %c", i, char)
		}
	}
}

// TestGenerateShareToken_Uniqueness tests that tokens are reasonably unique.
func TestGenerateShareToken_Uniqueness(t *testing.T) {
	tokens := make(map[string]bool)
	iterations := 100

	for i := 0; i < iterations; i++ {
		token, err := utils.GenerateShareToken()
		require.NoError(t, err)
		tokens[token] = true
	}

	// With 200+ adjectives and 500+ nouns, we should have high uniqueness
	// Allow for some small collision rate but expect > 95% unique
	uniqueCount := len(tokens)
	uniquePercent := float64(uniqueCount) / float64(iterations) * 100
	assert.Greater(t, uniquePercent, 95.0, "Should have >95%% unique tokens, got %.2f%%", uniquePercent)
}

// TestGenerateShareToken_Format tests that all tokens match the expected pattern.
func TestGenerateShareToken_Format(t *testing.T) {
	for i := 0; i < 20; i++ {
		token, err := utils.GenerateShareToken()
		require.NoError(t, err)

		// Should match pattern: ^[a-z]+-[a-z]+-[a-z]+$
		assert.Regexp(t, `^[a-z]+-[a-z]+-[a-z]+$`, token, "Token should match expected pattern")
	}
}

// TestGenerateShareToken_DifferentAdjectives tests that the two adjectives are usually different.
func TestGenerateShareToken_DifferentAdjectives(t *testing.T) {
	sameCount := 0
	iterations := 50

	for i := 0; i < iterations; i++ {
		token, err := utils.GenerateShareToken()
		require.NoError(t, err)

		parts := strings.Split(token, "-")
		if parts[0] == parts[1] {
			sameCount++
		}
	}

	// With retry logic, we should rarely have same adjectives
	// Allow up to 10% collision rate
	samePercent := float64(sameCount) / float64(iterations) * 100
	assert.Less(t, samePercent, 10.0, "Should have <10%% tokens with same adjectives, got %.2f%%", samePercent)
}

// TestValidateShareToken tests the validation of share tokens.
func TestValidateShareToken(t *testing.T) {
	tests := []struct {
		name     string
		token    string
		expected bool
	}{
		{
			name:     "valid token",
			token:    "swift-golden-dragon",
			expected: true,
		},
		{
			name:     "valid token with different words",
			token:    "brave-calm-phoenix",
			expected: true,
		},
		{
			name:     "invalid - uppercase letters",
			token:    "Swift-Golden-Dragon",
			expected: false,
		},
		{
			name:     "invalid - only two parts",
			token:    "swift-golden",
			expected: false,
		},
		{
			name:     "invalid - four parts",
			token:    "swift-golden-brave-dragon",
			expected: false,
		},
		{
			name:     "invalid - empty string",
			token:    "",
			expected: false,
		},
		{
			name:     "invalid - contains numbers",
			token:    "swift-golden-dragon123",
			expected: false,
		},
		{
			name:     "invalid - contains special characters",
			token:    "swift-golden-dragon!",
			expected: false,
		},
		{
			name:     "invalid - underscores instead of hyphens",
			token:    "swift_golden_dragon",
			expected: false,
		},
		{
			name:     "invalid - empty part",
			token:    "swift--dragon",
			expected: false,
		},
		{
			name:     "invalid - starts with hyphen",
			token:    "-swift-golden",
			expected: false,
		},
		{
			name:     "invalid - ends with hyphen",
			token:    "swift-golden-",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := utils.ValidateShareToken(tt.token)
			assert.Equal(t, tt.expected, result, "Token: %s", tt.token)
		})
	}
}

// TestValidateShareToken_GeneratedTokensAreValid tests that all generated tokens are valid.
func TestValidateShareToken_GeneratedTokensAreValid(t *testing.T) {
	for i := 0; i < 50; i++ {
		token, err := utils.GenerateShareToken()
		require.NoError(t, err)

		assert.True(t, utils.ValidateShareToken(token), "Generated token should be valid: %s", token)
	}
}

// BenchmarkGenerateShareToken benchmarks token generation performance.
func BenchmarkGenerateShareToken(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_, _ = utils.GenerateShareToken()
	}
}

// BenchmarkValidateShareToken benchmarks token validation performance.
func BenchmarkValidateShareToken(b *testing.B) {
	token := "swift-golden-dragon"
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = utils.ValidateShareToken(token)
	}
}
