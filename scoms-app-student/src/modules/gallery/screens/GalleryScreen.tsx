import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { colors, moduleColors, radius, shadow, spacing, typography } from '../../../constants/theme';
import { LoadingView } from '../../../components/LoadingView';
import { ErrorView } from '../../../components/ErrorView';
import { queryKeys } from '../../../services/api/queryKeys';
import { GalleryAlbum, GalleryPhoto, fetchAlbumPhotos, fetchAlbums } from '../services/galleryService';

const tint = moduleColors.gallery;
const CATEGORY: Record<string, string> = { EVENTS: 'Events', SPORTS: 'Sports', ACADEMICS: 'Academics', CULTURAL: 'Cultural', GENERAL: 'General' };

/** Full-screen swipeable viewer for one album's photos. */
function PhotoViewer({ photos, start, onClose }: { photos: GalleryPhoto[]; start: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(start);
  const photo = photos[index];
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <View style={styles.viewer}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={start}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={{ width, height }}>
              {item.imageData ? <Image source={{ uri: item.imageData }} style={styles.full} resizeMode="contain" /> : null}
            </View>
          )}
        />
        <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
          <Icon name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.viewerFooter}>
          <Text style={styles.counter}>{index + 1} / {photos.length}</Text>
          {photo?.caption ? <Text style={styles.caption}>{photo.caption}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function AlbumView({ album, onBack }: { album: GalleryAlbum; onBack: () => void }) {
  const { width } = useWindowDimensions();
  const size = Math.floor((width - spacing.md * 2 - spacing.xs * 2) / 3);
  const q = useQuery({ queryKey: [...queryKeys.gallery, album.id], queryFn: () => fetchAlbumPhotos(album.id), staleTime: 10 * 60_000 });
  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  return (
    <View style={styles.container}>
      <View style={styles.albumHeader}>
        <TouchableOpacity onPress={onBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Back to albums" hitSlop={8}>
          <Icon name="arrow-back" size={22} color={tint.solid} />
        </TouchableOpacity>
        <View style={styles.flex}>
          <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
          <Text style={styles.meta}>{album.photoCount} photo{album.photoCount === 1 ? '' : 's'} · {CATEGORY[album.category] ?? album.category}</Text>
        </View>
      </View>
      {q.isLoading ? (
        <LoadingView />
      ) : q.isError ? (
        <ErrorView onRetry={q.refetch} />
      ) : (
        <FlatList
          data={q.data ?? []}
          numColumns={3}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.photoGrid}
          ListHeaderComponent={album.description ? <Text style={styles.albumDesc}>{album.description}</Text> : undefined}
          ListEmptyComponent={<Text style={styles.emptyText}>No photos in this album yet.</Text>}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => setViewing(index)} style={[styles.thumb, { width: size, height: size }]} accessibilityRole="imagebutton" accessibilityLabel={item.caption ?? `Photo ${index + 1}`}>
              {item.imageData ? <Image source={{ uri: item.imageData }} style={styles.fill} /> : <Icon name="image" size={28} color={colors.textSecondary} />}
            </TouchableOpacity>
          )}
        />
      )}
      {viewing !== null && q.data ? <PhotoViewer photos={q.data} start={viewing} onClose={() => setViewing(null)} /> : null}
    </View>
  );
}

/** School photo albums (events, sports, …) — view only. */
export function GalleryScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.md * 3) / 2;
  const q = useQuery({ queryKey: queryKeys.gallery, queryFn: fetchAlbums, staleTime: 5 * 60_000 });
  const [album, setAlbum] = useState<GalleryAlbum | null>(null);

  if (album) return <AlbumView album={album} onBack={() => setAlbum(null)} />;
  if (q.isLoading) return <LoadingView />;
  if (q.isError) return <ErrorView onRetry={q.refetch} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={q.data ?? []}
      numColumns={2}
      columnWrapperStyle={styles.row}
      keyExtractor={(a) => a.id}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} colors={[tint.solid]} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Icon name="photo-library" size={44} color={tint.solid} />
          <Text style={styles.emptyTitle}>No albums yet</Text>
          <Text style={styles.emptyText}>Photos from school events will appear here.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={[styles.albumCard, { width: cardWidth }]} onPress={() => setAlbum(item)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${item.title}, ${item.photoCount} photos`}>
          <View style={[styles.cover, { height: cardWidth * 0.75, backgroundColor: tint.soft }]}>
            {item.coverImage ? <Image source={{ uri: item.coverImage }} style={styles.fill} /> : <Icon name="photo-library" size={34} color={tint.solid} />}
            <View style={styles.countPill}>
              <Icon name="photo" size={12} color="#fff" />
              <Text style={styles.countText}>{item.photoCount}</Text>
            </View>
          </View>
          <View style={styles.albumBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.meta}>{CATEGORY[item.category] ?? item.category}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  row: { justifyContent: 'space-between' },
  albumCard: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden', ...shadow(1) },
  cover: { alignItems: 'center', justifyContent: 'center' },
  fill: { width: '100%', height: '100%' },
  countPill: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700', marginLeft: 3 },
  albumBody: { padding: spacing.sm + 2 },
  cardTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  albumHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, ...shadow(1) },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: tint.soft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  albumTitle: { ...typography.h3, fontWeight: '700', color: colors.textPrimary },
  albumDesc: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  photoGrid: { padding: spacing.md },
  thumb: { margin: 1, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4 },
  viewer: { flex: 1, backgroundColor: '#000' },
  full: { width: '100%', height: '100%' },
  close: { position: 'absolute', top: 44, right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  viewerFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.45)' },
  counter: { ...typography.caption, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  caption: { ...typography.body, color: '#fff', marginTop: 4 },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
