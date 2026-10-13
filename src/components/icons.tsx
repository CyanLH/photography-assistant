const icons: Record<string, string> = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20.8 13.1A8.8 8.8 0 0 1 10.9 3.2a9 9 0 1 0 9.9 9.9Z"/>',
  sunset:
    '<path d="M3 17h18M4 21h16M7 17a5 5 0 0 1 10 0M12 3v4M3 10l3 2m15-2-3 2M9 5l3-3 3 3"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  camera:
    '<path d="M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  north: '<path d="m12 2 8 19-8-5-8 5 8-19Zm0 0v14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  bookmark: '<path d="M6 3h12v19l-6-4-6 4V3Z"/>',
  cloudsun:
    '<path d="M8 7a4 4 0 1 1 6 4M10 1v2M3 4l2 2M1 10h2m14-6-2 2"/><path d="M7 21a4 4 0 0 1-1-7.8 5.5 5.5 0 0 1 10.5-1.5A4.7 4.7 0 1 1 18 21H7Z"/>',
  landscape:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 18 6-6 4 4 4-7 4 5"/>',
  person: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 6v2"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
};
export function Icon({ name }: { name: string }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icons[name] || icons.info }}
    />
  );
}
