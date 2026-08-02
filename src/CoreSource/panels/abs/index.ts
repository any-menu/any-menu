export class AbsAmPanel {
  constructor(
    public el: HTMLElement,
    public p_el: HTMLElement,
    public p_panel: AbsAmPanel|null // 空表示无父面板
  ) {}
}
