# DOM 操作  

## Node API

### Node.insertBefore()  

> 在指定父节点内的参考节点前插入子节点(意思就是在指定节点前插入一个节点)  
> 如果给定的子节点是对文档中现有节点的引用，insertBefore() 会将其从当前位置移动到新位置(意思就是给节点移动位置)  

var insertedNode = parentNode.insertBefore(newNode, referenceNode);

* insertedNode 被插入节点 (newNode)
* parentNode 新插入节点的父节点
* newNode 用于插入的节点
* referenceNode newNode 将要插在这个节点之前  

### Text.splitText(offset)  

> 根据偏移位置对Text节点进行切割  
> 分割后的文本节点还可以使用Node.normalize方法来合并  
> offset文本节点的索引,从1开始计数  
