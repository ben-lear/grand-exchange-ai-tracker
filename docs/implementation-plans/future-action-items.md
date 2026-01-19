# Future Action Items - Watchlist System

**Status:** Deferred  
**Category:** Post-Launch Enhancements

## Overview

Collection of features and improvements identified during watchlist system planning that are out of scope for the initial implementation but should be considered for future development.

## Action Items

### Pin Item Limit Toast Notification
**Priority:** Low  
**Effort:** XS (< 30 minutes)  
**Description:** Add toast notification (using Sonner) when user attempts to pin more than 50 items

**Requirements:**
- Show informative toast message when pin limit is reached
- Include current count in message (e.g., "Maximum 50 items can be pinned")
- Use appropriate toast variant (warning or info)
- Potentially include action to manage/unpin items

**Technical Considerations:**
- Trigger from `usePinnedItemsStore.togglePin()` when limit check fails
- Import and use Sonner toast library (already in project)
- Consider adding link to "Manage Pins" feature (future enhancement)

**Related:**
- Implemented in dashboard table enhancements (January 2026)
- Store already returns `false` from `togglePin()` when at limit

### Template Management System
**Priority:** Medium  
**Effort:** L (2-4 hours)  
**Description:** Design admin panel or community system for maintaining and updating watchlist templates as OSRS meta evolves

**Requirements:**
- Admin interface for template CRUD operations
- Version control for template updates
- Community submission system for user-generated templates
- Template approval workflow
- Analytics on template usage and popularity

**Technical Considerations:**
- Backend admin API endpoints
- Template versioning and migration strategies
- User permission system for template management
- Template validation and quality assurance

### Template Discovery System
**Priority:** Low  
**Effort:** M (4-8 hours)  
**Description:** Design user interface for browsing, searching, and discovering available watchlist templates

**Requirements:**
- Dedicated templates page with search and filtering
- Template categories and tagging system
- Template ratings and reviews
- Trending/popular templates section
- Template preview with item details

**Technical Considerations:**
- Template metadata structure
- Search and filtering algorithms
- User rating system database design
- Performance optimization for template browsing

## Implementation Notes

These features were excluded from the main implementation plan to maintain focus on core watchlist functionality. They should be revisited after the initial watchlist system is deployed and user feedback is collected.

### Prioritization Criteria
1. **Template Management**: Higher priority due to maintenance needs as OSRS meta evolves
2. **Template Discovery**: Lower priority as the initial template set should be sufficient for launch

### Dependencies
- Both items depend on successful deployment and adoption of the core watchlist system
- Template Management requires admin role system (not currently in scope)
- Template Discovery benefits from user analytics and usage data

## Related Documents
- [007-favorites-watchlist.md](007-favorites-watchlist.md) - Main implementation plan