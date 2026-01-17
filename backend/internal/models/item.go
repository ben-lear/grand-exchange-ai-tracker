package models

import (
	"time"

	"gorm.io/gorm"
)

// Item represents an OSRS Grand Exchange item.
type Item struct {
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	HighAlch  *int           `gorm:"type:integer" json:"highAlch"`
	Examine   *string        `gorm:"type:text" json:"examine,omitempty"`
	Value     *int           `gorm:"type:integer" json:"value,omitempty"`
	IconName  *string        `gorm:"type:text" json:"iconName,omitempty"`
	BuyLimit  *int           `gorm:"type:integer" json:"buyLimit"`
	LowAlch   *int           `gorm:"type:integer" json:"lowAlch"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	IconURL   string         `gorm:"type:text" json:"iconUrl"`
	Name      string         `gorm:"size:255;not null;index" json:"name" validate:"required"`
	ID        uint           `gorm:"primaryKey" json:"id"`
	ItemID    int            `gorm:"uniqueIndex;not null" json:"itemId" validate:"required"`
	Members   bool           `gorm:"default:false" json:"members"`
}

// TableName overrides the table name.
func (Item) TableName() string {
	return "items"
}

// ItemSearchParams contains parameters for searching items.
type ItemSearchParams struct {
	Members   *bool
	Query     string
	SortBy    string
	SortOrder string
	Limit     int
	Offset    int
}

// ItemListParams contains parameters for listing items.
type ItemListParams struct {
	Members *bool  `query:"members"`
	SortBy  string `query:"sortBy" validate:"omitempty,oneof=name item_id members"`
	Order   string `query:"order" validate:"omitempty,oneof=asc desc"`
	Page    int    `query:"page" validate:"min=1"`
	Limit   int    `query:"limit" validate:"min=1,max=200"`
	Offset  int    `query:"offset" validate:"min=0"`
}

// DefaultItemListParams returns default parameters for item listing.
func DefaultItemListParams() ItemListParams {
	return ItemListParams{
		Page:   1,
		Limit:  100,
		Offset: 0,
		SortBy: "name",
		Order:  "asc",
	}
}

// ItemWithCurrentPrice represents an item with its current price information.
type ItemWithCurrentPrice struct {
	CurrentPrice *CurrentPrice `json:"currentPrice,omitempty"`
	Item
}
