package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
)

// Word lists for generating memorable tokens
var adjectives = []string{
	"swift", "golden", "bright", "brave", "calm", "clever", "cool", "cosmic",
	"daring", "eager", "fancy", "fierce", "gentle", "happy", "jolly", "kind",
	"lively", "lucky", "merry", "mighty", "noble", "proud", "quick", "quiet",
	"rapid", "royal", "shiny", "silent", "smart", "smooth", "solid", "strong",
	"sunny", "super", "tidy", "tiny", "tough", "vital", "warm", "wild",
	"wise", "witty", "agile", "alert", "amber", "azure", "bold", "bronze",
	"busy", "casual", "cheerful", "civil", "clean", "clear", "crisp", "crystal",
	"dark", "deep", "dense", "divine", "dull", "dusty", "early", "easy",
	"elegant", "fair", "fancy", "fast", "fine", "firm", "flat", "fleet",
	"fresh", "full", "fuzzy", "giant", "glad", "grand", "great", "green",
	"grim", "hard", "heavy", "high", "huge", "ideal", "iron", "jade",
	"keen", "large", "late", "lean", "light", "lone", "long", "loud",
	"low", "major", "metal", "mild", "minor", "misty", "mixed", "neat",
	"new", "nice", "old", "pale", "pearl", "pink", "plain", "prime",
	"pure", "rare", "raw", "red", "rich", "ripe", "rough", "round",
	"ruby", "safe", "sandy", "sassy", "sharp", "short", "sick", "silly",
	"simple", "single", "slim", "slow", "small", "soft", "spare", "spicy",
	"steel", "steep", "stern", "stiff", "stone", "stout", "sweet", "swift",
	"tall", "tame", "tan", "tart", "tender", "tense", "thick", "thin",
	"tight", "trim", "true", "twin", "ultra", "upper", "urban", "vague",
	"valid", "vast", "vivid", "warm", "weak", "white", "whole", "wide",
	"wild", "wise", "witty", "young", "agile", "alive", "alone", "ample",
	"angry", "aware", "awful", "basic", "black", "bland", "blank", "bleak",
	"blind", "blond", "blue", "blunt", "bored", "bound", "brave", "brief",
	"broad", "brown", "brisk", "bulky", "burly", "calm", "candid", "carbon",
	"cheap", "chief", "chill", "chubby", "civil", "classy", "clean", "clever",
	"cloudy", "cold", "coral", "corny", "cozy", "crazy", "crisp", "cruel",
	"curly", "curvy", "cute", "damp", "dapper", "dated", "dear", "decent",
}

var nouns = []string{
	"dragon", "phoenix", "tiger", "lion", "eagle", "wolf", "bear", "falcon",
	"hawk", "raven", "owl", "panther", "leopard", "jaguar", "cobra", "viper",
	"shark", "whale", "dolphin", "orca", "salmon", "marlin", "tuna", "trout",
	"knight", "warrior", "wizard", "sage", "monk", "ranger", "paladin", "rogue",
	"archer", "hunter", "scout", "guardian", "champion", "hero", "legend", "master",
	"storm", "thunder", "lightning", "flame", "frost", "wind", "earth", "stone",
	"mountain", "valley", "river", "ocean", "forest", "desert", "tundra", "glacier",
	"sword", "blade", "axe", "hammer", "spear", "bow", "staff", "wand",
	"shield", "armor", "helm", "crown", "ring", "amulet", "orb", "scepter",
	"castle", "tower", "fort", "keep", "citadel", "bastion", "stronghold", "palace",
	"star", "moon", "sun", "comet", "meteor", "nova", "galaxy", "nebula",
	"crystal", "diamond", "ruby", "emerald", "sapphire", "pearl", "jade", "amber",
	"phoenix", "unicorn", "griffin", "pegasus", "hydra", "kraken", "minotaur", "centaur",
	"titan", "giant", "golem", "elemental", "spirit", "wraith", "phantom", "specter",
	"quest", "journey", "voyage", "expedition", "crusade", "mission", "adventure", "odyssey",
	"realm", "kingdom", "empire", "domain", "territory", "province", "region", "land",
	"power", "might", "strength", "force", "energy", "vigor", "fury", "rage",
	"wisdom", "knowledge", "lore", "insight", "truth", "justice", "honor", "glory",
	"blade", "edge", "point", "tip", "fang", "claw", "talon", "horn",
	"wing", "tail", "scale", "shell", "hide", "fur", "feather", "bone",
	"fire", "water", "air", "earth", "light", "shadow", "void", "chaos",
	"order", "balance", "harmony", "discord", "peace", "war", "battle", "conflict",
	"victory", "triumph", "conquest", "defeat", "loss", "sacrifice", "redemption", "salvation",
	"dawn", "dusk", "twilight", "midnight", "noon", "sunrise", "sunset", "eclipse",
	"spring", "summer", "autumn", "winter", "season", "solstice", "equinox", "harvest",
	"alpha", "beta", "gamma", "delta", "epsilon", "omega", "prime", "nexus",
	"core", "heart", "soul", "mind", "spirit", "essence", "aura", "chi",
	"forge", "anvil", "smithy", "workshop", "foundry", "crucible", "kiln", "furnace",
	"scroll", "tome", "grimoire", "codex", "manuscript", "tablet", "rune", "sigil",
	"portal", "gateway", "door", "passage", "threshold", "bridge", "path", "road",
	"compass", "map", "chart", "guide", "beacon", "torch", "lantern", "flame",
	"sentinel", "warden", "keeper", "guardian", "protector", "defender", "champion", "savior",
	"seeker", "finder", "explorer", "discoverer", "pioneer", "voyager", "traveler", "wanderer",
	"maker", "builder", "creator", "architect", "engineer", "designer", "crafter", "artisan",
	"singer", "dancer", "player", "performer", "artist", "painter", "sculptor", "musician",
	"healer", "doctor", "medic", "physician", "surgeon", "nurse", "cleric", "shaman",
	"scholar", "student", "teacher", "mentor", "tutor", "professor", "sage", "elder",
	"merchant", "trader", "vendor", "dealer", "broker", "agent", "seller", "buyer",
	"farmer", "planter", "grower", "harvester", "reaper", "sower", "tiller", "gardener",
	"miner", "digger", "excavator", "prospector", "tunneler", "driller", "quarryman", "delver",
	"fisher", "angler", "caster", "netter", "trawler", "whaler", "seaman", "sailor",
	"smith", "forger", "metalworker", "blacksmith", "goldsmith", "silversmith", "coppersmith", "tinsmith",
	"tailor", "weaver", "spinner", "seamstress", "clothier", "draper", "dyer", "embroiderer",
	"baker", "cook", "chef", "brewer", "vintner", "distiller", "miller", "butcher",
	"carpenter", "woodworker", "joiner", "cabinetmaker", "turner", "carver", "cooper", "wheelwright",
	"mason", "stoneworker", "bricklayer", "tiler", "plasterer", "renderer", "sculptor", "carver",
	"potter", "ceramist", "glazier", "glassblower", "enameler", "mosaicist", "tilemaker", "clayworker",
	"tanner", "leatherworker", "cobbler", "shoemaker", "saddler", "harnessmaker", "bookbinder", "parchmentmaker",
	"scribe", "copyist", "illuminator", "calligrapher", "engraver", "printer", "typesetter", "binder",
	"alchemist", "apothecary", "herbalist", "druggist", "chemist", "pharmacist", "poisoner", "healer",
	"astronomer", "stargazer", "cosmologist", "astrologer", "oracle", "prophet", "seer", "diviner",
	"cartographer", "mapmaker", "surveyor", "navigator", "pilot", "helmsman", "steersman", "captain",
}

// GenerateShareToken generates a memorable token in the format "adjective-adjective-noun"
// Returns an error if it fails to generate random numbers
func GenerateShareToken() (string, error) {
	// Generate two random adjectives and one noun
	adj1, err := getRandomWord(adjectives)
	if err != nil {
		return "", fmt.Errorf("failed to generate first adjective: %w", err)
	}

	adj2, err := getRandomWord(adjectives)
	if err != nil {
		return "", fmt.Errorf("failed to generate second adjective: %w", err)
	}

	noun, err := getRandomWord(nouns)
	if err != nil {
		return "", fmt.Errorf("failed to generate noun: %w", err)
	}

	// Ensure the two adjectives are different
	maxRetries := 5
	for adj1 == adj2 && maxRetries > 0 {
		adj2, err = getRandomWord(adjectives)
		if err != nil {
			return "", fmt.Errorf("failed to regenerate second adjective: %w", err)
		}
		maxRetries--
	}

	token := fmt.Sprintf("%s-%s-%s", adj1, adj2, noun)
	return token, nil
}

// getRandomWord selects a random word from the given slice using crypto/rand
func getRandomWord(words []string) (string, error) {
	if len(words) == 0 {
		return "", fmt.Errorf("word list is empty")
	}

	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(words))))
	if err != nil {
		return "", fmt.Errorf("failed to generate random number: %w", err)
	}

	return words[n.Int64()], nil
}

// ValidateShareToken checks if a token matches the expected format
func ValidateShareToken(token string) bool {
	parts := strings.Split(token, "-")
	if len(parts) != 3 {
		return false
	}

	// Check that each part contains only lowercase letters
	for _, part := range parts {
		if len(part) == 0 {
			return false
		}
		for _, char := range part {
			if char < 'a' || char > 'z' {
				return false
			}
		}
	}

	return true
}
