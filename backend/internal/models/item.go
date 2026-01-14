package models

import (
	"time"

	"gorm.io/gorm"
)

// Item represents an OSRS Grand Exchange item
type Item struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	ItemID    int            `gorm:"uniqueIndex;not null" json:"itemId" validate:"required"`
	Name      string         `gorm:"size:255;not null;index" json:"name" validate:"required"`
	IconURL   string         `gorm:"type:text" json:"iconUrl"`
	Members   bool           `gorm:"default:false" json:"members"`
	BuyLimit  *int           `gorm:"type:integer" json:"buyLimit"`
	HighAlch  *int           `gorm:"type:integer" json:"highAlch"`
	LowAlch   *int           `gorm:"type:integer" json:"lowAlch"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName overrides the table name
func (Item) TableName() string {
	return "items"
}

// ItemSearchParams contains parameters for searching items
type ItemSearchParams struct {
	Query      string
	Members    *bool
	Limit      int
	Offset     int
	SortBy     string
	SortOrder  string
}

// ItemListParams contains parameters for listing items
type ItemListParams struct {
	Limit      int    `query:"limit" validate:"min=1,max=200"`
	Offset     int    `query:"offset" validate:"min=0"`
	SortBy     string `query:"sortBy" validate:"omitempty,oneof=name item_id members"`
	SortOrder  string `query:"sortOrder" validate:"omitempty,oneof=asc desc"`
	Members    *bool  `query:"members"`
}

// DefaultItemListParams returns default parameters for item listing
func DefaultItemListParams() ItemListParams {
	return ItemListParams{
		Limit:     100,
		Offset:    0,
		SortBy:    "name",
		SortOrder: "asc",
	}
}

// ItemWithCurrentPrice represents an item with its current price information
type ItemWithCurrentPrice struct {
	Item
	CurrentPrice *CurrentPrice `json:"currentPrice,omitempty"`
}
