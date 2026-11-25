export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  initials: string;
  title: string;
  subtitle: string;
  time: string;
  photo?: string;
  note?: string;
  stale?: boolean;
};
export type MapProps = { points: MapPoint[]; selectedId?: string | null; onSelect?: (id: string | null) => void; className?: string };
