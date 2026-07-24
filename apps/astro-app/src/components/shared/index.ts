/**
 * Composed app patterns, built on the shadcn primitives in `components/ui`.
 *
 * `ui/` owns generic primitives (Button, Dialog, Card). `shared/` owns the
 * patterns this product repeats: what an amount looks like, what a record
 * looks like, how we say "nothing here yet".
 */
export { Amount } from "./amount";
export { Callout, errorMessage } from "./callout";
export {
  CardTable,
  CardTableCell,
  CardTableRow,
  CARD_TABLE_GRID,
  type CardTableColumn,
} from "./card-table";
export { CategoryBadge } from "./category-badge";
export { ConfirmDialog } from "./confirm-dialog";
export { DataList, ListRow, ListTotal } from "./data-list";
export { HillsArt, PlantArt } from "./decor-art";
export { EmptyState } from "./empty-state";
export { HeroAmountField } from "./hero-amount-field";
export { ListGroupHeader } from "./list-group-header";
export {
  CalendarLegend,
  MonthCalendar,
  type CalendarEntry,
} from "./month-calendar";
export { RecordCard } from "./record-card";
export { SectionLabel } from "./section-label";
export { SegmentedControl, type SegmentedOption } from "./segmented-control";
export { CategoryShareRow, ShareBar } from "./share-bar";
export { Sparkline } from "./sparkline";
export { StatCard } from "./stat-card";
export { TrendDelta } from "./trend-delta";
