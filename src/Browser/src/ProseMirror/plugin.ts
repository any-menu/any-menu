import { Plugin } from 'prosemirror-state';
import { defaultMarkdownSerializer } from 'prosemirror-markdown';

/** 记录 ProseMirror 上的选区变更事件 */
export const selectionPlugin = new Plugin({
  view(editorView) {
    // 缓存上一次的选区，用于比较
    let prevSelection = editorView.state.selection;

    return {
      update(view, _prevState) {
        const newSelection = view.state.selection;

        // 判断选区是否发生变化（使用 eq 方法比较）
        if (!prevSelection.eq(newSelection)) {
          // 获取选区范围
          const { from, to } = newSelection;

          // 如果选区不为空（from !== to），则提取内容并序列化为 Markdown
          if (from !== to) {
            // 通过 slice 获取选区对应的文档片段
            const slice = view.state.doc.slice(from, to);
            // 将片段序列化为 Markdown 字符串
            const markdown = defaultMarkdownSerializer.serialize(slice.content);
            console.log('选中的 Markdown 内容：', markdown);
            // 在这里您可以将 markdown 传递给其他组件或进行业务处理
          } else {
            // 光标状态（无选中内容），可以忽略或做其他处理
            console.log('当前为光标位置，无选中内容');
          }

          // 更新缓存选区
          prevSelection = newSelection;
        }
      }
    };
  }
});
