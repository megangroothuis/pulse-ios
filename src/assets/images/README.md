# Playlist Cover Images

Add your default playlist cover images to this folder.

## Instructions

1. Add your cover image files (PNG, JPG, or other supported formats) to this directory
2. Name them: `cover1.png`, `cover2.png`, `cover3.png`, etc.
3. Update `src/components/SetlistCard.tsx`:
   - Uncomment the `require()` statements in the `defaultCoverImages` array
   - Add or remove entries to match your actual image files

## Example

If you have 3 images named `cover1.png`, `cover2.png`, and `cover3.png`, update the array like this:

```typescript
const defaultCoverImages: any[] = [
  require('../assets/images/cover1.png'),
  require('../assets/images/cover2.png'),
  require('../assets/images/cover3.png'),
];
```

The SetlistCard component will randomly select one of these images for each setlist in the feed.
