<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Ref } from "vue"

//@ts-ignore
import type { INodeState } from "vue3-treeview"
//@ts-ignore
import Tree from "vue3-treeview"

const props = defineProps<{
  object: Record<string, any>
  modelValue?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void
}>()


function extractChildrenRecursive(node: Record<string, any>, id = "<root>", previousTreeNodes: Record<string, {text: string, children: string[], state: INodeState}> | undefined = undefined, name: string | undefined = undefined) {
  const childIds: string[] = []
  const moreNodes: Record<string, { text: string, children: string[], state: INodeState }> = {}
  for (const [key, value] of Object.entries(node)) {
    const childId = id + '.' + key
    childIds.push(childId)
    const subchildren: string[] = []
    if (typeof value === 'object' && value.constructor === Object) {
      Object.assign(moreNodes, extractChildrenRecursive(value, childId, previousTreeNodes, key))
      subchildren.push(childId)
    }
    moreNodes[childId] = {
      text: key,
      children: subchildren,
      state: previousTreeNodes?.[childId]?.state || {},
    }
  }
  return {
    [id]: {
      text: name || id,
      children: childIds,
      state: previousTreeNodes?.[id]?.state || {opened: id === '<root>'},
    },
    ...moreNodes
  }
}

const nodes: Ref<any> = ref(extractChildrenRecursive(props.object))

const config = {
  roots: ['<root>'],
  editable: true
}

const tree = computed(() => props.object)
watch(tree, () => {
  nodes.value = extractChildrenRecursive(props.object, '<root>', nodes.value)
})

const onClick = (node: any) => {
  if (props.modelValue) {
    emit('update:modelValue', node.id)
  }
}
</script>

<template>
  <Tree :nodes="nodes" :config="config" @node-focus="onClick" class="object-tree" />
</template>

<style>
.object-tree {
  padding: 5px;
  width: 100%;
}

.focused {
  background-color: #ddd;
}
</style>