import ProviderGrid from '@/components/ProviderGrid';

export default function LabScreen() {
  return (
    <ProviderGrid
      role="lab"
      title="Available Labs"
      searchPlaceholder="Search labs..."
      fallbackName="Laboratory"
      fallbackSubtitle="Medical Laboratory"
      emptyLabel="labs"
    />
  );
}
