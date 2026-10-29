export interface GenEpixUiPhylogeneticTreeComponentTheme {
  backgroundColor?: string;
  labelFont?: string;
  regularFillColorSupportLine?: string;
  scaleColor?: string;
  scaleFont?: string;
  supportLineColorLinked?: string;
  supportLineColorUnlinked?: string;
  treeColor?: string;
}

export interface GenEpixUiPhylogeneticTreeTheme {
  components: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiPhylogeneticTree: GenEpixUiPhylogeneticTreeComponentTheme;
  };
}
