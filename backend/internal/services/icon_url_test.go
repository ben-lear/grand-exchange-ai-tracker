package services

import "testing"

func TestNormalizeItemIconURL(t *testing.T) {
	cases := []struct {
		name   string
		itemID int
		in     string
		want   string
	}{
		{
			name:   "empty falls back to sprite url",
			itemID: 4151,
			in:     "",
			want:   "https://secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=4151",
		},
		{
			name:   "http is upgraded to https",
			itemID: 4151,
			in:     "http://secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=4151",
			want:   "https://secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=4151",
		},
		{
			name:   "https is preserved",
			itemID: 4151,
			in:     "https://oldschool.runescape.wiki/images/Foo.png",
			want:   "https://oldschool.runescape.wiki/images/Foo.png",
		},
		{
			name:   "protocol-relative is upgraded to https",
			itemID: 4151,
			in:     "//secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=4151",
			want:   "https://secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=4151",
		},
		{
			name:   "path-only is prefixed with secure.runescape.com",
			itemID: 4151,
			in:     "/m=itemdb_oldschool/obj_sprite.gif?id=4151",
			want:   "https://secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=4151",
		},
		{
			name:   "relative filename falls back to sprite url",
			itemID: 4151,
			in:     "some_icon.png",
			want:   "https://secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=4151",
		},
		{
			name:   "no item id returns trimmed input (or https-upgraded)",
			itemID: 0,
			in:     "http://example.com/icon.png",
			want:   "https://example.com/icon.png",
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			got := normalizeItemIconURL(tc.itemID, tc.in)
			if got != tc.want {
				t.Fatalf("got %q, want %q", got, tc.want)
			}
		})
	}
}
