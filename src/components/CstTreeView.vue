<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Ref } from "vue"
import type { CstNode } from "chevrotain";
import type { TopLevelSequenceCstNode } from "../chevrotain/types";

//@ts-ignore
import type { INodeState } from "vue3-treeview"
//@ts-ignore
import Tree from "vue3-treeview"

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  modelValue?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void
}>()


function extractChildrenRecursive(node: CstNode, id = "topLevelSequence", previousTreeNodes: Record<string, {text: string, children: string[], state: INodeState}> | undefined = undefined, name: string | undefined = undefined) {
  const childIds: string[] = []
  const moreNodes: Record<string, { text: string, children: string[], state: INodeState }> = {}
  if (node.children) {
    for (const [typeName, arr] of Object.entries(node.children)) {
      const childId = id + '.children.' + typeName
      childIds.push(childId)
      const subchildren: string[] = []
      arr.forEach((entry, i) => {
        const subchildId = childId + '.' + i
        const subsubchildren: string[] = []
        Object.assign(moreNodes, extractChildrenRecursive(entry as CstNode, subchildId, previousTreeNodes, i.toString()))
        subchildren.push(subchildId)
      })
      moreNodes[childId] = {
        text: typeName,
        children: subchildren,
        state: previousTreeNodes?.[childId]?.state || {},
      }
    }
  }
  return {
    [id]: {
      text: name || id,
      children: childIds,
      state: previousTreeNodes?.[id]?.state || {opened: id === 'topLevelSequence'},
    },
    ...moreNodes
  }
}

const nodes: Ref<any> = ref(extractChildrenRecursive(props.cst))

const config = {
  roots: ['topLevelSequence'],
  editable: true
}

const tree = computed(() => props.cst)
watch(tree, () => {
  nodes.value = extractChildrenRecursive(props.cst, 'topLevelSequence', nodes.value)
})

const onClick = (node: any) => {
  emit('update:modelValue', node.id)
}
</script>

<template>
  <Tree :nodes="nodes" :config="config" @node-focus="onClick" class="cst-tree" />
</template>

<style>
.cst-tree {
  padding: 5px;
  width: 100%;
}

.focused {
  background-color: #ddd;
}
</style>