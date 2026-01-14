package unit

import (
	"os"
	"testing"

	"github.com/guavi/osrs-ge-tracker/internal/config"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadConfig_WithDefaults(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Save current directory and change to temp directory (no .env file)
	originalDir, _ := os.Getwd()
	defer os.Chdir(originalDir)

	tempDir := t.TempDir()
	os.Chdir(tempDir)

	// Clear any existing environment variables that might interfere
	clearEnvVars := []string{"PORT", "ENVIRONMENT", "CORS_ORIGINS", "POSTGRES_HOST", "POSTGRES_PORT",
		"POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "POSTGRES_SSL_MODE",
		"REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD", "REDIS_DB"}

	originalValues := make(map[string]string)
	for _, key := range clearEnvVars {
		originalValues[key] = os.Getenv(key)
		os.Unsetenv(key)
	}
	defer func() {
		for key, val := range originalValues {
			if val != "" {
				os.Setenv(key, val)
			}
		}
	}()

	// Load config (no .env file, should use defaults)
	config, err := config.LoadConfig()

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify server defaults
	assert.Equal(t, "8080", config.Port)
	assert.Equal(t, "development", config.Environment)
	assert.Equal(t, "*", config.CorsOrigins)

	// Verify database defaults
	assert.Equal(t, "localhost", config.PostgresHost)
	assert.Equal(t, "5432", config.PostgresPort)
	assert.Equal(t, "osrs_tracker", config.PostgresUser)
	assert.Equal(t, "password", config.PostgresPassword)
	assert.Equal(t, "osrs_ge_tracker", config.PostgresDB)
	assert.Equal(t, "disable", config.PostgresSSLMode)

	// Verify Redis defaults
	assert.Equal(t, "localhost", config.RedisHost)
	assert.Equal(t, "6379", config.RedisPort)
	assert.Equal(t, "", config.RedisPassword)
	assert.Equal(t, 0, config.RedisDB)

	// Verify OSRS API defaults
	assert.Equal(t, "https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json", config.OSRSBulkDumpURL)
	assert.Equal(t, "https://api.weirdgloop.org/exchange/history/osrs", config.OSRSHistoryURL)
	assert.Equal(t, "https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json", config.OSRSDetailURL)
	assert.Equal(t, "OSRS-GE-Tracker/1.0", config.OSRSUserAgent)

	// Verify scheduler defaults
	assert.Equal(t, "*/1 * * * *", config.PricePollInterval)
	assert.Equal(t, "0 * * * *", config.HistoricalSyncCron)
	assert.Equal(t, "0 0 * * *", config.FullHistoricalCron)
}

func TestLoadConfig_WithEnvironmentVariables(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set environment variables
	os.Setenv("PORT", "9000")
	os.Setenv("ENVIRONMENT", "production")
	os.Setenv("CORS_ORIGINS", "https://example.com")
	os.Setenv("POSTGRES_HOST", "db.example.com")
	os.Setenv("POSTGRES_PORT", "5433")
	os.Setenv("POSTGRES_USER", "test_user")
	os.Setenv("POSTGRES_PASSWORD", "test_pass")
	os.Setenv("POSTGRES_DB", "test_db")
	os.Setenv("POSTGRES_SSL_MODE", "require")
	os.Setenv("REDIS_HOST", "redis.example.com")
	os.Setenv("REDIS_PORT", "6380")
	os.Setenv("REDIS_PASSWORD", "redis_pass")
	os.Setenv("REDIS_DB", "2")
	os.Setenv("OSRS_USER_AGENT", "Custom-Agent/2.0")
	os.Setenv("PRICE_POLL_INTERVAL", "*/5 * * * *")

	// Cleanup environment variables after test
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("ENVIRONMENT")
		os.Unsetenv("CORS_ORIGINS")
		os.Unsetenv("POSTGRES_HOST")
		os.Unsetenv("POSTGRES_PORT")
		os.Unsetenv("POSTGRES_USER")
		os.Unsetenv("POSTGRES_PASSWORD")
		os.Unsetenv("POSTGRES_DB")
		os.Unsetenv("POSTGRES_SSL_MODE")
		os.Unsetenv("REDIS_HOST")
		os.Unsetenv("REDIS_PORT")
		os.Unsetenv("REDIS_PASSWORD")
		os.Unsetenv("REDIS_DB")
		os.Unsetenv("OSRS_USER_AGENT")
		os.Unsetenv("PRICE_POLL_INTERVAL")
	}()

	// Load config
	config, err := config.LoadConfig()

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify environment variables override defaults
	assert.Equal(t, "9000", config.Port)
	assert.Equal(t, "production", config.Environment)
	assert.Equal(t, "https://example.com", config.CorsOrigins)
	assert.Equal(t, "db.example.com", config.PostgresHost)
	assert.Equal(t, "5433", config.PostgresPort)
	assert.Equal(t, "test_user", config.PostgresUser)
	assert.Equal(t, "test_pass", config.PostgresPassword)
	assert.Equal(t, "test_db", config.PostgresDB)
	assert.Equal(t, "require", config.PostgresSSLMode)
	assert.Equal(t, "redis.example.com", config.RedisHost)
	assert.Equal(t, "6380", config.RedisPort)
	assert.Equal(t, "redis_pass", config.RedisPassword)
	assert.Equal(t, 2, config.RedisDB)
	assert.Equal(t, "Custom-Agent/2.0", config.OSRSUserAgent)
	assert.Equal(t, "*/5 * * * *", config.PricePollInterval)
}

func TestLoadConfig_PartialEnvironmentVariables(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set only some environment variables
	os.Setenv("PORT", "3000")
	os.Setenv("POSTGRES_HOST", "custom-db.local")

	// Cleanup
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("POSTGRES_HOST")
	}()

	// Load config
	config, err := config.LoadConfig()

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify environment variables
	assert.Equal(t, "3000", config.Port)
	assert.Equal(t, "custom-db.local", config.PostgresHost)

	// Verify defaults for non-overridden values
	assert.Equal(t, "development", config.Environment)
	assert.Equal(t, "5432", config.PostgresPort)
	assert.Equal(t, "osrs_tracker", config.PostgresUser)
}

func TestLoadConfig_RedisDBIntegerParsing(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set REDIS_DB as string (environment variable)
	os.Setenv("REDIS_DB", "5")

	// Cleanup
	defer func() {
		os.Unsetenv("REDIS_DB")
	}()

	// Load config
	config, err := config.LoadConfig()

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify Redis DB is parsed as integer
	assert.Equal(t, 5, config.RedisDB)
}

func TestLoadConfig_EmptyEnvironmentVariables(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Note: In viper, setting an env var to empty string still allows
	// the default to be used because GetString() returns the default
	// when the value is empty. This is different from setting a non-empty value.

	// This test validates that viper falls back to defaults
	// when environment variables are unset
	os.Unsetenv("PORT")
	os.Unsetenv("POSTGRES_HOST")

	// Load config
	config, err := config.LoadConfig()

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, config)

	// When unset, should use defaults
	assert.Equal(t, "8080", config.Port)
	assert.Equal(t, "localhost", config.PostgresHost)
	assert.Equal(t, "development", config.Environment)
}

func TestLoadConfig_AllSchedulerCronExpressions(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set custom cron expressions
	os.Setenv("PRICE_POLL_INTERVAL", "*/2 * * * *")
	os.Setenv("HISTORICAL_SYNC_CRON", "30 * * * *")
	os.Setenv("FULL_HISTORICAL_CRON", "0 2 * * *")

	// Cleanup
	defer func() {
		os.Unsetenv("PRICE_POLL_INTERVAL")
		os.Unsetenv("HISTORICAL_SYNC_CRON")
		os.Unsetenv("FULL_HISTORICAL_CRON")
	}()

	// Load config
	config, err := config.LoadConfig()

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify custom cron expressions
	assert.Equal(t, "*/2 * * * *", config.PricePollInterval)
	assert.Equal(t, "30 * * * *", config.HistoricalSyncCron)
	assert.Equal(t, "0 2 * * *", config.FullHistoricalCron)
}

func TestLoadConfig_AllOSRSAPIURLs(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set custom OSRS API URLs
	os.Setenv("OSRS_BULK_DUMP_URL", "https://custom.example.com/bulk")
	os.Setenv("OSRS_HISTORY_URL", "https://custom.example.com/history")
	os.Setenv("OSRS_DETAIL_URL", "https://custom.example.com/detail")

	// Cleanup
	defer func() {
		os.Unsetenv("OSRS_BULK_DUMP_URL")
		os.Unsetenv("OSRS_HISTORY_URL")
		os.Unsetenv("OSRS_DETAIL_URL")
	}()

	// Load config
	config, err := config.LoadConfig()

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify custom URLs
	assert.Equal(t, "https://custom.example.com/bulk", config.OSRSBulkDumpURL)
	assert.Equal(t, "https://custom.example.com/history", config.OSRSHistoryURL)
	assert.Equal(t, "https://custom.example.com/detail", config.OSRSDetailURL)
}

func TestLoadConfig_ConfigFileNotFound_NoError(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Change to a directory where .env doesn't exist
	originalDir, _ := os.Getwd()
	defer os.Chdir(originalDir)

	// Create temp directory and change to it
	tempDir := t.TempDir()
	os.Chdir(tempDir)

	// Load config (should not error even without .env file)
	config, err := config.LoadConfig()

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Should use defaults
	assert.Equal(t, "8080", config.Port)
}

func TestSetDefaults_AllFieldsHaveDefaults(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Call setDefaults directly
	config.setDefaults()

	// Verify all defaults are set
	assert.Equal(t, "8080", viper.GetString("PORT"))
	assert.Equal(t, "development", viper.GetString("ENVIRONMENT"))
	assert.Equal(t, "*", viper.GetString("CORS_ORIGINS"))

	assert.Equal(t, "localhost", viper.GetString("POSTGRES_HOST"))
	assert.Equal(t, "5432", viper.GetString("POSTGRES_PORT"))
	assert.Equal(t, "osrs_tracker", viper.GetString("POSTGRES_USER"))
	assert.Equal(t, "password", viper.GetString("POSTGRES_PASSWORD"))
	assert.Equal(t, "osrs_ge_tracker", viper.GetString("POSTGRES_DB"))
	assert.Equal(t, "disable", viper.GetString("POSTGRES_SSL_MODE"))

	assert.Equal(t, "localhost", viper.GetString("REDIS_HOST"))
	assert.Equal(t, "6379", viper.GetString("REDIS_PORT"))
	assert.Equal(t, "", viper.GetString("REDIS_PASSWORD"))
	assert.Equal(t, 0, viper.GetInt("REDIS_DB"))

	assert.Equal(t, "https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json", viper.GetString("OSRS_BULK_DUMP_URL"))
	assert.Equal(t, "https://api.weirdgloop.org/exchange/history/osrs", viper.GetString("OSRS_HISTORY_URL"))
	assert.Equal(t, "https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json", viper.GetString("OSRS_DETAIL_URL"))
	assert.Equal(t, "OSRS-GE-Tracker/1.0", viper.GetString("OSRS_USER_AGENT"))

	assert.Equal(t, "*/1 * * * *", viper.GetString("PRICE_POLL_INTERVAL"))
	assert.Equal(t, "0 * * * *", viper.GetString("HISTORICAL_SYNC_CRON"))
	assert.Equal(t, "0 0 * * *", viper.GetString("FULL_HISTORICAL_CRON"))
}

func TestLoadConfig_MultipleCallsDoNotInterfere(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// First call
	config1, err1 := config.LoadConfig()
	require.NoError(t, err1)
	assert.Equal(t, "8080", config1.Port)

	// Set environment variable
	os.Setenv("PORT", "9999")
	defer os.Unsetenv("PORT")

	// Second call (should pick up new env var)
	viper.Reset()
	config2, err2 := config.LoadConfig()
	require.NoError(t, err2)
	assert.Equal(t, "9999", config2.Port)
}

func TestLoadConfig_DatabaseConnectionString(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set database configuration
	os.Setenv("POSTGRES_HOST", "prod-db.example.com")
	os.Setenv("POSTGRES_PORT", "5433")
	os.Setenv("POSTGRES_USER", "prod_user")
	os.Setenv("POSTGRES_PASSWORD", "secure_password")
	os.Setenv("POSTGRES_DB", "prod_database")
	os.Setenv("POSTGRES_SSL_MODE", "require")

	// Cleanup
	defer func() {
		os.Unsetenv("POSTGRES_HOST")
		os.Unsetenv("POSTGRES_PORT")
		os.Unsetenv("POSTGRES_USER")
		os.Unsetenv("POSTGRES_PASSWORD")
		os.Unsetenv("POSTGRES_DB")
		os.Unsetenv("POSTGRES_SSL_MODE")
	}()

	// Load config
	config, err := config.LoadConfig()
	require.NoError(t, err)

	// Verify all database fields
	assert.Equal(t, "prod-db.example.com", config.PostgresHost)
	assert.Equal(t, "5433", config.PostgresPort)
	assert.Equal(t, "prod_user", config.PostgresUser)
	assert.Equal(t, "secure_password", config.PostgresPassword)
	assert.Equal(t, "prod_database", config.PostgresDB)
	assert.Equal(t, "require", config.PostgresSSLMode)
}

func TestLoadConfig_RedisConnectionSettings(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set Redis configuration
	os.Setenv("REDIS_HOST", "redis-cluster.example.com")
	os.Setenv("REDIS_PORT", "6380")
	os.Setenv("REDIS_PASSWORD", "redis_secret")
	os.Setenv("REDIS_DB", "3")

	// Cleanup
	defer func() {
		os.Unsetenv("REDIS_HOST")
		os.Unsetenv("REDIS_PORT")
		os.Unsetenv("REDIS_PASSWORD")
		os.Unsetenv("REDIS_DB")
	}()

	// Load config
	config, err := config.LoadConfig()
	require.NoError(t, err)

	// Verify all Redis fields
	assert.Equal(t, "redis-cluster.example.com", config.RedisHost)
	assert.Equal(t, "6380", config.RedisPort)
	assert.Equal(t, "redis_secret", config.RedisPassword)
	assert.Equal(t, 3, config.RedisDB)
}

func TestLoadConfig_DevelopmentEnvironment(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set development environment
	os.Setenv("ENVIRONMENT", "development")
	defer os.Unsetenv("ENVIRONMENT")

	// Load config
	config, err := config.LoadConfig()
	require.NoError(t, err)

	// Verify development settings
	assert.Equal(t, "development", config.Environment)
}

func TestLoadConfig_ProductionEnvironment(t *testing.T) {
	// Reset viper before test
	viper.Reset()

	// Set production environment
	os.Setenv("ENVIRONMENT", "production")
	os.Setenv("CORS_ORIGINS", "https://app.example.com,https://www.example.com")
	defer func() {
		os.Unsetenv("ENVIRONMENT")
		os.Unsetenv("CORS_ORIGINS")
	}()

	// Load config
	config, err := config.LoadConfig()
	require.NoError(t, err)

	// Verify production settings
	assert.Equal(t, "production", config.Environment)
	assert.Equal(t, "https://app.example.com,https://www.example.com", config.CorsOrigins)
}
