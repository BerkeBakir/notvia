import { ThumbsUp } from "@phosphor-icons/react/dist/ssr";
import { isCommunityApproved } from "@/lib/rating";

/** "Topluluk onaylı" rozeti: yeterince beğeni almış ve beğenenleri açıkça çoğunlukta olan notlar. */
export function CommunityBadge({ likes, dislikes }: { likes: number; dislikes: number }) {
  if (!isCommunityApproved(likes, dislikes)) return null;
  return (
    <span
      className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-500"
      title="Çok sayıda öğrenci tarafından beğenildi"
    >
      <ThumbsUp size={12} weight="fill" /> Topluluk onaylı
    </span>
  );
}
