---
title: "第 24 章 算法与数据结构（前端高频）"
---

## 第 24 章 算法与数据结构（前端高频）

### Q1 面试里让你分析一段代码的时间复杂度，你一般怎么下手？

**考察点**：考是否真懂复杂度（Big O）的定义与推导方法，而不是背"双层循环就是 O(n²)"。能说清"抓最高阶、去常数"并现场推导就过关。

**参考答案**：

> **一句话结论**：复杂度描述的是数据规模 n 增长时运算量的**增长趋势**，不是具体耗时；推导就看最深层代码执行了多少次，取最高阶、扔掉常数与低阶项。

1. 只看增长趋势，不看常数：`O(2n)` 与 `O(n)` 是同一量级；`n=10` 时 O(n²) 可能比 O(n log n) 快，但 n 一大必然反超——面试问的是规模变大后谁先崩。
2. 推导三步：找出执行次数最多的那行 → 写出它关于 n 的表达式 → 只保留最高阶。`for` 里 `i *= 2` 是 O(log n)，因为循环次数是 log₂n 级别。
3. 看循环结构而不是看行数：并列两个循环是相加取最大，嵌套是相乘。递归要写递推式，再靠主定理或画递归树得出，例如归并排序 `T(n) = 2T(n/2) + O(n)` 得 O(n log n)。
4. 常见量级排序：O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)。面试里把 O(n log n) 说成"比 O(n²) 好一个 log 因子"就够了。
5. **复杂度与边界**：空间复杂度只算**额外**开销，输入本身不计入；最容易让推导失效的三种边界是 n=0 的空输入、n=1 的单元素、全部元素相同。

**追问与易错点**：

- 追问：`Array.prototype.includes` 的复杂度是多少？答：O(n) 线性查找；`Set.has` / `Map.get` 是 O(1) 平均，这正是"用 Map 换时间"的理论依据。
- 追问：`arr.push` 和 `arr.unshift` 呢？答：`push` 均摊 O(1)（偶发扩容），`unshift`/`shift` 要把所有元素整体搬移，是 O(n)，循环里用 `shift` 是最常见的性能坑。
- 陷阱：说"复杂度就是代码跑多久"，或者把 `O(2n)` 说成比 `O(n)` 慢一倍还当结论，都会被当场纠正。

### Q2 时间复杂度和空间复杂度怎么权衡？什么是均摊复杂度？

**考察点**：考"用空间换时间"的取舍判断，以及均摊（Amortized）分析这个高频概念，`push` 与哈希表扩容是最好的例子。

**参考答案**：

> **一句话结论**：时间与空间通常此消彼长，算法题里默认优先换时间（哈希表、前缀和、备忘录），只有在内存受限（移动端、大文件、流式场景）时才反向优化；均摊复杂度指的是"偶尔一次很贵，平摊到每次操作很便宜"。

1. 空间复杂度只算**额外**开销，不算输入本身：原地（In-place）算法额外空间 O(1)，转存一份数组就是 O(n)。
2. 换时间的典型手段：哈希表把查找从 O(n) 降到 O(1)；前缀和把区间求和从 O(n) 降到 O(1)；记忆化把递归从 O(2ⁿ) 降到 O(n)。
3. 保空间的典型场景：前端处理大数组/大文件时不能整份转存，要流式或分块处理，用 O(1) 双指针代替 O(n) 的辅助数组。
4. 均摊复杂度（Amortized Complexity）：`push` 平时 O(1)，数组容量满时扩容要整体复制一次 O(n)，但扩容是倍数增长（V8 约为 1.5 倍），连续 n 次 push 总代价 O(n)，摊到每次仍是 O(1)。
5. 均摊 ≠ 平均：平均复杂度是对输入分布求期望，均摊是对**一串操作序列**求平均，不依赖概率假设，是最坏情况下的总量摊派。
6. **复杂度与边界**：均摊分析的前提是"扩容按倍数增长"；若每次只扩容固定长度（如 +1），`push` 会退化成 O(n)。

```js
// 均摊的直观来源：倍数扩容，总复制次数 1+2+4+...+n < 2n
let cap = 1, copies = 0;
for (let n = 1; n <= 1024; n *= 2) { copies += cap; cap *= 2; }
// copies 最终 < 2 * 1024 => 每次 push 均摊 O(1)
```

**追问与易错点**：

- 追问：哈希表查询"O(1)"是严格保证吗？答：是均摊/平均 O(1)。冲突退化成链表且负载因子高时最坏 O(n)，这也是哈希冲突要处理的根因。
- 追问：什么场景必须放弃哈希表？答：内存极其受限或需要稳定可预测的延迟（如嵌入式），此时用排序 + 二分（O(n log n) + O(log n)）更稳。
- 陷阱：把均摊说成"平均情况下很快"，就把两种分析混为一谈；也别说"空间复杂度就是用了几个变量"。

### Q3 冒泡、选择、插入、快排、归并、堆排序，怎么实现、怎么对比？稳定性又是什么？

**考察点**：考六大排序的实现能力、复杂度表、稳定性，以及"为什么工程里实际用 TimSort 而不是裸快排"。能手写快排/归并且答出对比表才算过关。

**参考答案**：

> **一句话结论**：冒泡/选择/插入是 O(n²) 的入门级，快排/归并/堆排是 O(n log n) 的主力；快排平均最快但最坏 O(n²) 且不稳定，归并稳定但需 O(n) 额外空间，堆排原地且最坏仍 O(n log n) 但常数大、不稳定。

1. 冒泡（Bubble）：相邻两两比较，每轮把最大值冒到末尾，稳定；加"本轮无交换则提前结束"可对近乎有序数据做到 O(n)。
2. 选择（Selection）：每轮从未排序区间找最小值交换到前面，交换次数最少（最多 n-1 次），但不稳定。
3. 插入（Insertion）：把当前元素插入前面已排序区间，稳定，对基本有序数据接近 O(n)，是小区间排序的最优选择，也是 V8 TimSort 的底层组件。
4. 快速排序（Quick Sort）：选基准分区（Partition），左边都比基准小、右边都比基准大，再递归两侧。平均 O(n log n)，最坏 O(n²)（已有序 + 固定选首元素做基准），靠随机基准/三数取中规避。不稳定、原地。
5. 归并排序（Merge Sort）：对半切分再合并两个有序数组，`T(n)=2T(n/2)+O(n)` 得稳定 O(n log n)，**天生适合链表排序**，代价是 O(n) 额外空间。
6. 堆排序（Heap Sort）：建大顶堆 O(n)，反复把堆顶换到末尾再下沉，最坏也是 O(n log n)、额外空间 O(1)，但访问跳跃、缓存不友好，实测常慢于快排，不稳定。
7. **稳定性**：指相等元素排序后**相对次序不变**；有远距离交换的算法（快排、选择、堆排）不稳定，只做相邻比较与插入的（冒泡、插入、归并）稳定。业务上"先按分数排、再按班级排"就靠它实现多字段排序。
8. **边界条件**：空数组与单元素数组要能直接返回；比较器必须返回数字，返回 `true/false` 会被转成 `1/0` 导致排序错乱。

| 排序 | 平均 | 最坏 | 空间 | 稳定性 | 适用 |
| --- | --- | --- | --- | --- | --- |
| 冒泡 | O(n²) | O(n²) | O(1) | 稳定 | 教学 / 少量数据 |
| 选择 | O(n²) | O(n²) | O(1) | 不稳定 | 交换成本高的场景 |
| 插入 | O(n²) | O(n²) | O(1) | 稳定 | 小数组 / 基本有序 |
| 快排 | O(n log n) | O(n²) | O(log n) | 不稳定 | 通用内存排序，常数最优 |
| 归并 | O(n log n) | O(n log n) | O(n) | 稳定 | 链表 / 要求稳定 |
| 堆排 | O(n log n) | O(n log n) | O(1) | 不稳定 | 只求 TopK / 内存极紧 |

```js
const quickSort = (arr) => {
  if (arr.length <= 1) return arr;              // 递归出口
  const [p, ...rest] = arr;                     // 取首元素为基准（生产应随机化）
  // 注：filter 分区会额外分配数组，本实现额外空间是 O(n log n)；要对应表格的"原地 O(log n)"须改成双指针原地分区
  const left = rest.filter((x) => x < p);
  const right = rest.filter((x) => x >= p);     // >= 保证等值元素不漏
  return [...quickSort(left), p, ...quickSort(right)];
};

const byScoreDesc = (a, b) => b.score - a.score;   // 比较器必须返回数字
const byClassAsc = (a, b) => a.classId - b.classId;
list.sort(byScoreDesc).sort(byClassAsc);           // 借稳定性做二级排序
```

**追问与易错点**：

- 追问：`Array.prototype.sort` 稳定吗？答：ES2019 起规范已明确要求稳定；V8 7.0 前长数组用不稳定快排、短数组用插入排序，之后统一改为 TimSort。
- 追问：快排最坏情况怎么优化？答：随机化基准或三数取中避免有序输入退化成 O(n²)，小区间（如 ≤10）切插入排序，递归深时改用尾递归/显式栈防止爆栈。
- 陷阱：说"快排最坏 O(n log n)"是硬伤；说"归并原地排序"也不对，标准归并必须 O(n) 辅助数组。

### Q4 手写单链表反转，怎么写最稳？顺便说说判环、找中点和合并有序链表。

**考察点**：考指针操作的严谨性与"链表四件套"（反转、判环、找中点、合并）能否用同一套双指针语言讲清。

**参考答案**：

> **一句话结论**：反转用 `prev`/`curr` 双指针，每次先用 `next` 保存后继再反转方向，O(n) 时间 O(1) 空间；判环用快慢指针相遇，找中点用快指针走两步，合并有序链表用哑节点加双指针逐个接入。

1. 反转三步不能颠倒：先 `next = curr.next` 存后继，再 `curr.next = prev` 反转，最后 `prev = curr; curr = next` 前进。漏存后继就会断链。
2. 循环结束时 `curr` 为 `null`、`prev` 指向原链表尾节点（新头节点），所以返回 `prev`；空链表返回 `null`，单节点无需特判。
3. 判环：慢指针每次 1 步、快指针每次 2 步；若有环，进入环后快指针每轮相对慢指针靠近 1 步，必然追上；若无环，快指针先到 `null` 退出。找中点：`while (fast && fast.next)` 同步推进，快指针到头时慢指针即中点。
4. 合并有序链表：建哑节点 `dummy` 与游标 `tail`，每次取两链表当前较小者接到 `tail.next`，最后 `tail.next = a || b` 把剩余部分整体挂上。哑节点的价值是省掉"首节点单独判断"的分支。
5. 递归反转的代价：空间是递归栈 O(n)，链表很长时抛 `RangeError: Maximum call stack size exceeded`，所以工程上优先迭代版。
6. **复杂度与边界**：反转/判环/找中点时间 O(n)、空间 O(1)；合并是 O(n+m)、空间 O(1)。边界：空链表、单节点、`while (fast && fast.next)` 两个条件都不能少（漏掉 `fast` 判空会越界），合并比较用 `<=` 以保持稳定性。

```js
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next; // 先存后继，否则断链
    curr.next = prev;       // 反转指针
    prev = curr;
    curr = next;
  }
  return prev;              // 原尾节点即新头节点
}
function mergeTwoLists(a, b) {
  const dummy = { next: null }; // 哑节点，省掉首节点特判
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; } // <= 保持稳定
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a || b;           // 接上剩余部分
  return dummy.next;
}
// 判断有环：快慢指针，相遇即有环（时间 O(n)、空间 O(1)）
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
// 找中点：快指针走两步、慢指针走一步，快指针到头时慢指针即中点
const middleNode = (head) => {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow;
};
```

**追问与易错点**：

- 追问：有环怎么找入口？答：相遇后让一个指针回到起点，两指针同速前进，再次相遇处就是入环点；数学上由"头到入口距离 = 相遇点到入口距离"保证。
- 追问：快指针能不能走三步？答：不行。相对速度为 1 才能保证在环内一定相遇，走三步可能直接跳过慢指针永远错过。
- 陷阱：把 `curr.next = prev` 写在 `const next = curr.next` 之前，或返回 `curr`（此时是 `null`）；合并时忘记 `tail.next = a || b` 收尾会漏掉剩余节点。

### Q5 用两个栈实现一个队列，怎么想？最小栈又怎么设计？

**考察点**：考栈与队列的语义差异，以及"一次倒腾只做一次"的均摊思想与"辅助栈记录历史极值"的设计直觉。

**参考答案**：

> **一句话结论**：队列用 `inStack` 入队、`outStack` 出队，只在 `outStack` 为空时把 `inStack` 整体倒入，单次可能 O(n) 但每个元素只搬一次，均摊 O(1)；最小栈用一个同步的辅助栈记录"每个历史状态的最小值"，所有操作 O(1)。

1. 栈是后进先出（LIFO），队列是先进先出（FIFO）；入栈顺序与出队顺序相反，所以要用第二个栈"倒序"一次。
2. 关键纪律：只在 `outStack` 为空时才整体倒腾，绝不能每次 `pop` 都倒一遍，否则复杂度从均摊 O(1) 退化成 O(n)。
3. 最小栈的核心洞察：最小值会随弹栈"回退"，所以必须把**每个历史状态的最小值**都存下来，这正是辅助栈的作用。
4. 最小栈的规则：`push` 时主栈压 `val`、辅助栈压 `Math.min(val, 辅助栈顶)`；`pop` 时两栈同步弹出，`getMin` 直接取辅助栈顶。
5. 辅助栈优化：只在"新值 ≤ 当前最小值"时才压入（注意用 `<=` 而非 `<`，否则重复最小值被提前弹走），常见数据下能明显省内存。
6. **复杂度与边界**：双栈队列 `push` 稳定 O(1)，`pop`/`peek` 最坏 O(n)、均摊 O(1)，空间 O(n)；最小栈全部操作 O(1)，额外空间 O(n)。边界：空队列 `pop` 应返回 `undefined` 或抛错而不是静默出错；`outStack` 非空时不能再倒入 `inStack`，否则 FIFO 顺序被破坏。

```js
// 用两个栈实现队列：只在 outStack 空时倒腾一次（均摊 O(1)）
class MyQueue {
  constructor() { this.inStack = []; this.outStack = []; }
  push(x) { this.inStack.push(x); }
  _shift() {                                     // 只在 outStack 空时倒腾
    if (!this.outStack.length) {
      while (this.inStack.length) this.outStack.push(this.inStack.pop());
    }
  }
  pop() { this._shift(); return this.outStack.pop(); }
  empty() { return !this.inStack.length && !this.outStack.length; }
}
// 最小栈：辅助栈同步记录每个历史状态的最小值
class MinStack {
  constructor() { this.stack = []; this.min = []; }
  push(v) {
    this.stack.push(v);
    this.min.push(Math.min(v, this.min.length ? this.min[this.min.length - 1] : Infinity));
  }
  pop() { this.min.pop(); return this.stack.pop(); } // 两栈同步弹
  getMin() { return this.min[this.min.length - 1]; }
}
```

**追问与易错点**：

- 追问：最小栈能不能只用一个变量记最小值？答：不行。弹出当前最小值后"上一个最小值"就找不回来了，除非能 O(n) 重新扫描，那就破坏了 O(1)。
- 追问：为什么双栈队列的均摊是 O(1)？答：n 个元素总搬运次数不超过 n，总操作数 O(n)，摊到每个元素 O(1)。
- 陷阱：每次 `pop` 都无条件倒腾一遍，功能对但复杂度错；最小栈辅助栈用 `<` 而不是 `<=`，重复最小值只入栈一次，弹出一次后 `getMin` 就错了。

### Q6 有效的括号怎么解？单调栈又是什么？

**考察点**：考栈的两个典型应用——配对校验与"找下一个更大元素"；能说清单调栈为什么是 O(n) 才算过关。

**参考答案**：

> **一句话结论**：括号题遇左括号入栈、遇右括号必须与栈顶配对，否则失败，遍历完栈必须为空；单调栈是栈内元素保持单调的栈，专门解"找每个元素左/右第一个更大或更小的元素"，每个元素最多进出栈一次，所以是 O(n)。

1. 括号题的失败条件一：遇到右括号时栈为空，说明没有可配对的左括号，如 `")("`。
2. 括号题的失败条件二：栈顶与当前右括号类型不一致，说明嵌套顺序非法，如 `"([)]"`——数量对但顺序错。
3. 括号题的收尾条件：遍历结束后栈必须为空，否则有未闭合的左括号，如 `"((("`。这一步最容易被漏掉。
4. 优化：用哈希表存"右括号 → 左括号"的映射，把多层 `if/else` 压成一次查表；栈空时 `pop()` 返回 `undefined`，与任何字符都不等，天然返回 `false`。
5. 单调栈的识别信号：题目出现"下一个更大元素""每日温度""接雨水""柱状图最大矩形"就该想到它。求下一个更大元素用**递减栈**：`while (栈顶值 < 当前值)` 弹出并记录当前值就是栈顶的下一个更大元素；需要求"滑动窗口最大值"时用的是它的近亲**单调队列**。
6. **复杂度与边界**：括号题时间 O(n)、空间 O(n)；单调栈虽然内层有 `while`，但每个元素只入栈一次、出栈一次，总操作数 ≤ 2n，所以也是 O(n)、空间 O(n)。边界：空字符串应返回 `true`；单调栈要求存**下标**而不是值，否则无法计算距离或位置。

```js
// 有效的括号：遇左括号入栈，遇右括号必须与栈顶配对
function isValid(s) {
  const map = { ')': '(', ']': '[', '}': '{' };
  const st = [];
  for (const ch of s) {
    if (!map[ch]) st.push(ch);            // 左括号入栈
    else if (st.pop() !== map[ch]) return false; // 栈空或错配都失败
  }
  return st.length === 0;                 // 结尾必须清空
}
// 每日温度：下一个更高温还有几天（单调递减栈，栈存下标）
function dailyTemperatures(T) {
  const res = new Array(T.length).fill(0), stack = [];
  for (let i = 0; i < T.length; i++) {
    while (stack.length && T[i] > T[stack[stack.length - 1]]) {
      const j = stack.pop();              // j 的下一个更高温就是 i
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;                             // 栈中剩余元素保持 0
}
```

**追问与易错点**：

- 追问：求"下一个更小元素"怎么改？答：把递减栈改成递增栈，比较符号反过来（栈顶 > 当前值就弹出）。
- 追问：单调栈和优先队列怎么选？答：需要"整体有序并随时取最大"用堆；只需要"每个元素找最近的更大/更小邻居"用单调栈，后者 O(n) 且实现更简单。
- 陷阱：括号题只统计左右括号数量是否相等，会放过 `"([)]"`；说单调栈是 O(n²)（因为看到两层循环），没意识到每个元素只进出一次。

### Q7 哈希表是怎么实现的？哈希冲突怎么解决？JS 里 Map 和对象有什么区别？

**考察点**：考哈希函数、冲突处理与 JS 落地实现的差异；能说清"为什么 Map 的 key 可以是任意类型"才算过关。

**参考答案**：

> **一句话结论**：哈希表用哈希函数把 key 映射到桶下标，实现平均 O(1) 的增删查；冲突用链地址法（拉链）或开放寻址法解决；JS 的 `Map` 允许任意类型 key 且保留插入顺序，普通对象只允许字符串（和 Symbol）key。

1. 基本结构：`bucket = hash(key) % capacity`，桶里存键值对；查找时先定位桶，再在桶内比较 key 是否相等。
2. 冲突处理——链地址法：同一下标的元素挂成链表（Java 的 `HashMap` 在链表过长时转红黑树）；实现简单、删除方便，是主流做法。
3. 冲突处理——开放寻址法：位置被占就按线性探测/平方探测往后找空位；省去指针开销、缓存友好，但删除要打墓碑标记，负载因子高时性能骤降。
4. 扩容与负载因子：元素数 / 桶数超过阈值（如 0.75）就扩容并重新哈希（Rehash），保证平均 O(1)；这就是哈希表"均摊 O(1)"的来源。
5. JS 差异：`Map` 的 key 可以是对象、函数、`NaN`（用 SameValueZero 比较），并保证插入顺序遍历；普通对象的 key 都会被 `toString` 成字符串，所以 `obj[{a:1}]` 实际是 `obj["[object Object]"]`，是个隐蔽 bug。
6. **复杂度与边界**：平均 O(1) 是"哈希均匀 + 负载因子受控"的假设下的结论，最坏 O(n)（全部撞同一个桶）；边界：用 `WeakMap` 存 DOM 节点或对象引用可避免内存泄漏，但 `WeakMap` 不可遍历、也没有 `size`。

| 对比项 | Object | Map |
| --- | --- | --- |
| key 类型 | 字符串 / Symbol | 任意类型（含对象） |
| 顺序 | 整数键升序 + 字符串插入序 | 严格插入顺序 |
| 大小 | 需 `Object.keys().length` | `map.size` O(1) |
| 原型污染 | 有（可用 `Object.create(null)` 规避） | 无 |
| JSON | 直接支持 | 需手动转数组 |

**追问与易错点**：

- 追问：为什么说 `Map` 查找是"平均" O(1)？答：假设哈希均匀分布且负载因子受控；最坏情况所有 key 撞同一个桶，退化成 O(n)。
- 追问：什么是哈希洪水攻击（Hash Flooding）？答：攻击者构造大量同桶 key 让哈希表退化成链表，拖垮服务；防御手段是随机化哈希种子（如 SipHash）。
- 陷阱：用对象当 key 做缓存，`cache[obj]` 实际是 `cache["[object Object]"]`，所有对象互相覆盖；这种 bug 只能用 `Map` 或 `WeakMap` 解决。

### Q8 两数之和怎么做？能不能再优？

**考察点**：考从暴力 O(n²) 到哈希 O(n) 的优化推导，以及"为什么必须先查后存"这个细节。

**参考答案**：

> **一句话结论**：用哈希表存"已遍历元素 → 下标"，遍历时先查 `target - nums[i]` 是否出现过，存在即返回两个下标；时间 O(n)、空间 O(n)，比双重循环的 O(n²) 快一个量级。

1. 暴力法：两层循环枚举所有组合，时间 O(n²)、空间 O(1)。面试要先说出暴力解，再给出优化，体现推导过程而不是直接背答案。
2. 优化动机：暴力法的瓶颈在"每次都要重新找一个数是否存在"——这正是哈希表擅长的事，把"查找"从 O(n) 降到 O(1)。
3. 一次遍历：遍历时先查补数是否已在表里，在就返回；不在就把当前元素和下标存表。顺序不能反，否则同一个元素会被自己匹配两次（如 `[3], target=6`）。
4. **复杂度与边界**：时间 O(n)、空间 O(n)。边界：空数组或无解返回空数组；重复值（`[3,3], target=6`）必须靠"下标不同"判断，先查后存的写法天然满足。
5. 取舍：有解且只需一组时哈希最优；如果数组**已排序**且要求 O(1) 额外空间，用左右双指针更优，时间 O(n)、空间 O(1)。
6. 同族题：三数之和、四数之和用排序 + 双指针；"和为 K 的子数组"用前缀和 + 哈希表。

```js
function twoSum(nums, target) {
  const map = new Map();                  // 值 -> 下标
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i]; // 先查
    map.set(nums[i], i);                          // 后存
  }
  return [];                              // 无解
}
```

**追问与易错点**：

- 追问：为什么不能先存后查？答：会把当前元素自己当成补数，`[3], target=6` 会错误返回 `[0,0]`。
- 追问：如果数组有序，还有更优解吗？答：左右双指针，和小于 target 左指针右移、和大于 target 右指针左移，O(n) 时间 O(1) 空间，比哈希省内存。
- 陷阱：用对象 `{}` 做表时下标为 `0` 会被判假，`if (map[need])` 漏掉下标 0；应该用 `!== undefined` 或直接用 `Map`。

### Q9 字符串反转、单词反转、最长公共前缀、回文判断怎么一次讲清？

**考察点**：考字符串 API 组合能力、`Unicode` 边界意识与"逐字符纵向比较"的直觉；能主动提"表情符号会被拆坏"才算过关。

**参考答案**：

> **一句话结论**：字符串反转用 `[...str].reverse().join('')`；单词反转先按空格切分再反转单词顺序；最长公共前缀以第一个字符串为基准逐字符与其他串同位比较；回文用左右双指针跳过非字母数字字符。四者都是 O(n) 级别。

1. 字符反转：用扩展运算符而不是 `split('')`，因为扩展运算符按 Unicode 码点切分，不会把 emoji 拆成两个乱码字符。
2. 单词反转（句子翻转）：经典做法是先整体反转再对每个单词反转；或者 `split(/\s+/)` 反转后拼接——**注意**这会丢失原来的连续空格与首尾空格，若题目要求保留空格就必须用双指针原地处理。
3. 最长公共前缀（Longest Common Prefix）：纵向扫描，同时比较所有字符串的第 `i` 个字符，有一个不同或长度不足就返回前 `i` 个字符。最坏时间 O(n·m)（n 为串个数、m 为最短串长度），空间 O(1)。
4. 回文判断（Palindrome）：左右双指针，跳过非字母数字字符并统一小写，指针相遇即回文。允许删除一个字符的变体用双指针 + 一次跳过的分支判断。
5. **复杂度与边界**：字符反转与回文 O(n) 时间，`split/reverse/join` 额外 O(n) 空间、双指针 O(1)；最长公共前缀 O(n·m)。边界：数组为空返回 `''`、只有一个字符串返回它本身、存在空串时公共前缀必然是 `''`、回文要能跳过标点。
6. 常见追问：`'👍'.split('')` 会得到两个乱码代理项，所以必须用扩展运算符或 `Array.from`；"最长公共子串"与"最长公共前缀"不是一回事，前者允许出现在任意位置。

```js
function longestCommonPrefix(strs) {
  if (!strs.length) return '';          // 空数组边界
  for (let i = 0; i < strs[0].length; i++) {
    const ch = strs[0][i];
    for (let j = 1; j < strs.length; j++) {
      if (i >= strs[j].length || strs[j][i] !== ch) return strs[0].slice(0, i);
    }
  }
  return strs[0];                       // 第一个串本身就是公共前缀
}
// 回文判断：左右双指针，跳过非字母数字字符
function isPalindrome(s) {
  const t = s.toLowerCase();
  let i = 0, j = t.length - 1;
  const ok = (c) => /[a-z0-9]/.test(c);
  while (i < j) {
    while (i < j && !ok(t[i])) i++;
    while (i < j && !ok(t[j])) j--;
    if (t[i++] !== t[j--]) return false;
  }
  return true;
}
const reverseStr = (s) => [...s].reverse().join(''); // 按码点反转，emoji 安全

```

**追问与易错点**：

- 追问：`s.trim().split(/\s+/)` 做单词反转的缺陷？答：把多个空格压成一个并去掉首尾空格，若题目要求"保持原有空格"就错了，此时要用双指针原地反转。
- 追问：最长公共前缀字符串很长时怎么优化？答：先按长度排序只比较最短串的长度上限，或用二分答案 + 校验公共前缀把每次比较规模压下来。
- 陷阱：回文判断忘记跳过标点，`"A man, a plan, a canal: Panama"` 会被判成非回文；最长公共前缀漏判 `i >= strs[j].length` 会依赖"读到 undefined"的巧合。

### Q10 无重复字符的最长子串，滑动窗口怎么写？

**考察点**：考滑动窗口（Sliding Window）模板与"窗口何时收缩"的判断；能说清为什么是 O(n) 而非 O(n²) 才算过关。

**参考答案**：

> **一句话结论**：用左右指针维护一个"无重复字符"的窗口，右指针扩张、遇到重复就把左指针跳到"上次出现位置 + 1"；每个字符最多被左右指针各访问一次，所以时间 O(n)、空间 O(字符集大小)。

1. 窗口定义：`[left, right]` 内始终没有重复字符，`right` 每次右移一步尝试扩张。
2. 收缩规则：若 `s[right]` 已在窗口内出现过，就更新 `left = max(left, 上次出现下标 + 1)`；取 `max` 是为了防止 `left` 回退。
3. 用 `Map` 记录"字符 → 最近一次出现的下标"，查重与定位一步到位，比"发现重复后逐个左指针后移"更简洁（后者是 while 收缩版，复杂度同样是 O(n)）。
4. **复杂度与边界**：`right` 单向走到 n-1、`left` 只增不减，每个字符进出窗口各一次，总操作 O(n)，空间 O(min(n, 字符集))。边界：空串返回 0；全同字符串返回 1；`left` 更新前要先算当前长度 `right - left + 1`；必须判断"上次出现的位置是否在当前窗口内"。
5. 同族题：最小覆盖子串、至多含 K 个不同字符的最长子串、找所有字母异位词——都是同一套"右扩左缩"模板，差别只在窗口合法性的判定条件。

```js
function lengthOfLongestSubstring(s) {
  const last = new Map();        // 字符 -> 最近出现的下标
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch) >= left) {
      left = last.get(ch) + 1;   // 只收缩到重复字符的下一位
    }
    last.set(ch, right);
    max = Math.max(max, right - left + 1);
  }
  return max;
}
```

**追问与易错点**：

- 追问：为什么必须判断 `last.get(ch) >= left`？答：如果上次出现在窗口左侧之外（已被移出窗口），就不该收缩，否则 `left` 会倒退导致结果偏小。
- 追问：字符集只有 ASCII 时怎么优化？答：用长度 128 的数组代替 `Map`，访问更快且省去哈希开销。
- 陷阱：写成"发现重复就 `left++` 并重新扫描窗口"，虽然结果对，但会退化成 O(n²)，这正是面试官想区分的实现。

### Q11 有序数组去重、盛最多水的容器、三数之和，双指针为什么快？

**考察点**：考双指针的核心前提——"有序性带来的剪枝"，三题串讲能体现模式迁移能力。

**参考答案**：

> **一句话结论**：双指针之所以能从 O(n²) 降到 O(n) 或 O(n log n)，是因为利用单调性"一次移动就能排除一整批不可能解"；它要求数组有序，或者问题本身具备可收缩的最优子结构。

1. 有序数组原地去重：慢指针 `slow` 指向已去重区间末尾，快指针 `fast` 扫描；`nums[fast] !== nums[slow]` 时才 `slow++` 并覆盖。时间 O(n)、空间 O(1)，是"读写指针"的经典形态。
2. 盛最多水的容器：左右指针从两端向中间收，每次移动**较短**的那一侧。原因：容量由短板决定，移动长板高度只会更矮或持平，宽度却一定变小，所以不可能产生更优解。
3. 三数之和：先排序 O(n log n)，外层固定一个数 `nums[i]`，内层对右侧区间做左右双指针求两数之和为 `-nums[i]`。总体 O(n²)，比三重循环的 O(n³) 好一个数量级。
4. 三数之和的细节：排序后要跳过重复的 `nums[i]`；找到一组解后左右指针都要跳过重复元素，否则结果集会出现重复三元组。
5. **复杂度与边界**：去重 O(n)/O(1)、盛水 O(n)/O(1)、三数之和 O(n²)/O(1)（不计排序空间）。边界：空数组与长度不足的数组要直接返回；去重要覆盖最后一个元素；三数之和在 `nums[i] > 0` 时可直接结束，且不存在 O(n log n) 的通用解法（3SUM 猜想）。
6. 剪枝：`nums[i] + nums[i+1] + nums[i+2] > 0` 时也可提前结束，减少无谓循环。

```js
// 三数之和：排序 + 固定一个数 + 左右双指针，O(n²)
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;                         // 剪枝：最小值为正
    if (i > 0 && nums[i] === nums[i - 1]) continue; // 跳过重复的固定值
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum === 0) {
        res.push([nums[i], nums[l], nums[r]]);
        while (l < r && nums[l] === nums[l + 1]) l++; // 跳过重复
        while (l < r && nums[r] === nums[r - 1]) r--;
        l++; r--;
      } else if (sum < 0) l++; else r--;
    }
  }
  return res;
}
```

**追问与易错点**：

- 追问：盛水容器为什么不能移动长板？答：移动长板后新容量 = min(新短板, 原短板或更矮的值) × 更小的宽度，上界严格不升，因此不会产生更优解，可以安全排除。
- 追问：双指针和滑动窗口是什么关系？答：滑动窗口是双指针的一种特例，两个指针同向移动维护一个区间；"相向双指针"依赖有序性做剪枝，两者适用条件不同。
- 陷阱：三数之和忘记跳过重复元素，结果里会有多组重复三元组；有序数组去重时漏掉把最后一个元素写回结果数组。

### Q12 二分查找的标准写法是什么？旋转数组、找峰值怎么改？

**考察点**：考区间定义的统一性（左闭右闭 vs 左闭右开）、`mid` 溢出细节，以及"局部有序即可二分"的迁移能力。

**参考答案**：

> **一句话结论**：写二分的唯一诀窍是**先定死区间语义**，全程保持同一套不变量：推荐 `[left, right]` 左闭右闭，循环条件 `left <= right`，收缩时 `left = mid + 1` / `right = mid - 1`，这样一定不会死循环；二分不要求全局有序，只要每次能排除一半。

1. 左闭右闭模板：`while (left <= right)`；命中返回 `mid`；`nums[mid] < target` 则 `left = mid + 1`；否则 `right = mid - 1`。区间每次至少缩小 1，必然收敛。
2. 左闭右开模板：`right = nums.length`，`while (left < right)`，`right = mid`。两套都正确，混用才是 bug 之源——例如左闭右开却写 `right = mid - 1` 会漏掉元素。
3. `mid` 计算写 `left + ((right - left) >> 1)`：`(left + right) / 2` 在超大数组（接近 2³¹）时可能整数溢出，JS 用浮点不会有此问题，但这是 Java/C++ 面试的标准答案。
4. 旋转数组：判断 `[left, mid]` 是否有序（`nums[left] <= nums[mid]`，用 `<=` 而非 `<`）。左半有序就看 `target` 是否落在 `[nums[left], nums[mid])`，右半有序就看是否落在 `(nums[mid], nums[right]]`，据此收缩。
5. 找峰值（`nums[i] > nums[i+1]` 为峰值，两端视为负无穷）：比较 `nums[mid]` 与 `nums[mid+1]`，上升就 `left = mid + 1`，下降就 `right = mid`，循环结束时 `left` 即峰值下标。直观解释是"只要处于上坡，右侧必然存在峰值"。
6. **复杂度与边界**：标准二分与找峰值时间 O(log n)、空间 O(1)；数组必须有序且支持随机访问（链表不能二分）。边界：旋转数组**有重复元素**时（如 `[1,1,3,1]`）`nums[left] === nums[mid]` 无法判断哪边有序，只能 `left++` 逐格收缩，最坏退化成 O(n)；找峰值用 `left < right` 避免访问越界的 `nums[mid+1]`。

```js
function binarySearch(nums, target) {
  let left = 0, right = nums.length - 1;   // 左闭右闭 [left, right]
  while (left <= right) {                  // 区间为空时退出
    const mid = left + ((right - left) >> 1); // 防溢出写法
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;   // 收缩左边界
    else right = mid - 1;                     // 收缩右边界
  }
  return -1;                               // 未找到
}

function findPeakElement(nums) {
  if (!nums.length) return -1;                      // 空数组无峰值
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const mid = left + ((right - left) >> 1);
    if (nums[mid] > nums[mid + 1]) right = mid;     // 下坡，峰值在左含 mid
    else left = mid + 1;                            // 上坡，峰值在右
  }
  return left;
}
```

**追问与易错点**：

- 追问：怎么找"第一个大于等于 target 的位置"？答：命中时不要返回，令 `right = mid` 继续向左逼；循环结束 `left` 即为答案（可能等于 `nums.length` 表示所有元素都小）。
- 追问：二分为什么容易死循环？答：`mid` 向下取整时若收缩写成 `left = mid`（而不是 `mid + 1`），区间长度不变就会死循环。记住"左边界跳一格、右边界跳一格"。
- 陷阱：`while (left < right)` 配 `[left, right]` 闭区间会漏掉最后剩下的元素；旋转数组判断有序时用 `<` 而非 `<=`，区间只剩两个相等元素时方向判反。

### Q13 递归、回溯与剪枝：全排列、子集、组合总和怎么统一理解？

**考察点**：考回溯模板（选择 → 递归 → 撤销）的迁移能力，以及"什么时候需要 `used` 数组、什么时候需要 `start` 下标"。

**参考答案**：

> **一句话结论**：回溯 = 递归 + 撤销选择，本质是在决策树上做深度优先搜索；**排列**问题用一个 `used` 数组标记已选元素，**组合/子集**问题用 `start` 下标保证不重复选前面的元素。

1. 通用模板四件套：① 判断是否到达决策树底部（收集结果）；② 遍历当前可选项；③ 做选择、递归、撤销选择；④ 必要时剪枝提前返回。
2. 全排列：每层从所有未使用的元素里挑一个，用 `used[i]` 标记，撤销时 `used[i] = false` 并 `path.pop()`。含重复元素时要先排序并跳过"同层重复"的分支。
3. 子集：把决策树上的**每个节点**都收进结果（不只是叶子），用 `start` 保证后续只取下标更大的元素。
4. 组合总和：可重复取同一元素时递归传 `i`（不 +1），不可重复时传 `i + 1`；配合"排序 + 当前值大于剩余目标就 break"剪枝。
5. **复杂度与边界**：全排列时间 O(n·n!)，子集 O(n·2ⁿ)，组合总和介于两者之间，递归栈空间 O(n)。边界：空数组时全排列返回 `[[]]`（一个空排列）、子集返回 `[[]]`；收集结果必须拷贝 `[...path]`；忘记撤销选择会导致结果集不完整。
6. 递归转迭代：任何递归都能用显式栈改写以避免爆栈；但回溯类题目用栈改写可读性大幅下降，所以实际做法是保留递归 + 控制深度或剪枝降低深度。

```js
// 全排列：used 标记 + 回溯撤销（做选择 → 递归 → 撤销）
function permute(nums) {
  const res = [], path = [], used = new Array(nums.length).fill(false);
  const dfs = () => {
    if (path.length === nums.length) return res.push([...path]); // 收集副本
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]);   // 做选择
      dfs();
      path.pop(); used[i] = false;          // 撤销选择
    }
  };
  dfs();
  return res;
}
// 子集：start 下标保证不回头，决策树每个节点都是解
function subsets(nums) {
  const res = [], path = [];
  const dfs = (start) => {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]); dfs(i + 1); path.pop();
    }
  };
  dfs(0);
  return res;
}
```

**追问与易错点**：

- 追问：为什么收集结果要写 `[...path]` 而不是 `res.push(path)`？答：`path` 是同一个数组引用，后续回溯会改它，最后所有结果都会变成同一个（通常是空数组）。
- 追问：括号生成怎么套模板？答：左括号数量 `< n` 就能加左括号，右括号数量 `< 左括号数量` 才能加右括号，这两个条件天然完成了合法性剪枝，不需要额外校验。
- 陷阱：回溯时忘记撤销 `used[i] = false` 或 `path.pop()`，会导致后续分支可选项越来越少，结果集不完整。

### Q14 二叉树的三种遍历，递归和非递归都要会吗？

**考察点**：考树遍历的背诵级基本功，以及非递归实现里"访问顺序与入栈顺序"的对应关系；能默写前中序迭代版才算过关。

**参考答案**：

> **一句话结论**：递归版三种遍历只是"访问根节点的时机不同"（前序在递归左右前、中序在中间、后序在最后），时间 O(n)、空间 O(h)；非递归版要用显式栈，前序最简单（先压右后压左），中序要"一路向左压栈"，后序可用"前序变体 + 结果反转"实现。

1. 递归版：只需交换三行的顺序——前序 `visit → left → right`，中序 `left → visit → right`，后序 `left → right → visit`。
2. 前序迭代：栈里压节点，弹出即访问，然后**先压右孩子、再压左孩子**（栈是后进先出，压的次序要反过来），这样弹出顺序才是左先右后。
3. 中序迭代：从根一路向左入栈，走到 `null` 就弹出栈顶访问，然后转向它的右孩子。这保证了"左子树全部处理完才访问根"。
4. 后序迭代：把前序的"根左右"改成"根右左"（压栈时先压左再压右），最后把结果数组反转即为"左右根"。这是最省事的写法。
5. **复杂度与边界**：时间 O(n)，每个节点进出栈各一次；空间 O(h)，h 是树高。边界：空树返回空数组；递归版最坏（链状树）h = n，会随深度增加栈帧甚至爆栈，非递归版用堆上的数组，容量不受引擎栈限制。
6. Morris 遍历：利用叶子节点的空指针做线索，可做到 O(1) 空间、O(n) 时间，代价是会临时修改树结构，属于加分项而非必答。

```js
// 前序 根->左->右（迭代：先压右再压左，弹出即访问）
function preorder(root) {
  if (!root) return [];
  const res = [], stack = [root];
  while (stack.length) {
    const node = stack.pop();
    res.push(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return res;
}
// 中序 左->根->右（迭代：一路向左压栈，弹出后转向右孩子）
function inorder(root) {
  const res = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; } // 一路向左
    cur = stack.pop();
    res.push(cur.val);                  // 左子树处理完才访问根
    cur = cur.right;
  }
  return res;
}
// 后序迭代：按"根右左"遍历后反转结果，即为"左右根"
```

**追问与易错点**：

- 追问：中序 + 前序能唯一确定一棵二叉树吗？答：能（前提是节点值互不相同）。前序定根，中序划分左右子树，递归即可重建；但前序 + 后序**不能**唯一确定，因为分不清只有一个孩子时它是左还是右。
- 追问：怎么判断一棵树是否是二叉搜索树？答：中序遍历结果严格递增即成立；等价做法是递归时携带上下界区间，每个节点都要落在自己的区间内（只比较父子节点是错的）。
- 陷阱：前序迭代时先压左再压右，结果会变成"根右左"；后序迭代忘记反转结果数组。

### Q15 层序遍历、最大深度、镜像、对称，树题怎么归类？

**考察点**：考树题的两大范式——"BFS 逐层处理"与"DFS 递归下推/上收"，能按题型选范式并写对对称判断才算过关。

**参考答案**：

> **一句话结论**：树题只有两个骨架——需要按层处理用 BFS（队列 + 记录每层长度），需要子树信息汇总用 DFS（后序位置"上收"子树返回值）；镜像是对称的特例，对称必须用双指针**交叉**比较。

1. 层序遍历（BFS）：队列初始放根，每轮先记 `size = queue.length`，一次性弹出这一层的所有节点并把子节点入队，就能把"层"切分出来。空间 O(w)（w 为最大层宽）。
2. 队列实现细节：用头指针 `head++` 递增读取代替 `queue.shift()`——`shift` 是 O(n) 的搬移操作，会让整体退化成 O(n²)。
3. 最大深度：DFS 后序 `1 + max(depth(left), depth(right))`；也可以 BFS 边遍历边计数层数。前者代码更短，后者在极深树上不担心递归栈。
4. 镜像（翻转二叉树）：递归交换左右孩子再递归翻转；BFS 也可以，每个节点把左右孩子换一下即可。
5. 判断对称（Symmetric）：这不是比较节点自身，而是**双指针同步比较**——判断 `left.left` 与 `right.right`、`left.right` 与 `right.left` 是否相等，两个方向都要对上。只比较同层对应位置会漏判。
6. **复杂度与边界**：四题时间都是 O(n)，层序空间 O(w)、递归类空间 O(h)。边界：空树返回 `[]`/`0`/`true`；对称判断传入的是 `root.left` 与 `root.right` 两个子树，而不是 `root` 自身。

```js
// 层序遍历（BFS 逐层：先固定本层长度再切分）
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  let head = 0;                             // 头指针代替 shift，避免 O(n) 搬移
  while (head < queue.length) {
    const size = queue.length, level = [];
    for (let i = head; i < size; i++) {
      const node = queue[i];
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    head = size;
    res.push(level);
  }
  return res;
}
// 对称：必须是交叉比较（左的左 vs 右的右、左的右 vs 右的左）
function isMirror(a, b) {
  if (!a || !b) return a === b;                     // 同时为空才对称
  return a.val === b.val && isMirror(a.left, b.right) && isMirror(a.right, b.left);
}
const isSymmetric = (root) => !root || isMirror(root.left, root.right);
```

**追问与易错点**：

- 追问：对称和镜像有什么区别？答：镜像是把一棵树整体翻转（变换自身），对称是判断一棵树是否是它自己的镜像（比较左右子树），判定函数不同但递归结构相通。
- 追问：求最大深度能用 BFS 吗？答：可以，每处理完一层就 `depth++`，循环结束时的深度就是答案；好处是不受递归栈限制。
- 陷阱：对称判断写成 `isMirror(a.left, b.left) && isMirror(a.right, b.right)`，这是"结构相同"而不是"对称"，最高频的错误。

### Q16 最近公共祖先怎么求？二叉搜索树怎么校验和查找？

**考察点**：考"后序上收"这一通用树技巧，以及 BST 定义中"整棵子树的区间约束"这个关键细节。

**参考答案**：

> **一句话结论**：最近公共祖先（LCA，Lowest Common Ancestor）用后序递归，若左右子树各返回一个目标节点则当前节点即 LCA，只有一侧返回非空就继续上抛，一次遍历 O(n)；BST 的校验必须传"上下界区间"，不能只比较父子节点。

1. LCA 递归三句：`if (!root || root === p || root === q) return root;` 取左右递归结果；`if (left && right) return root;` 两侧都有就是答案；`return left || right;` 否则把找到的那个继续向上传递。
2. BST 上的 LCA 更快：利用大小关系从根往下走，`p`、`q` 都小于当前值就往左、都大于就往右，否则当前节点即 LCA，时间 O(h)。
3. BST 定义复习：任意节点的左子树所有值都小于它、右子树所有值都大于它。注意是**子树全体**，不是仅直接孩子。
4. 常见错解：只判断 `root.left.val < root.val && root.right.val > root.val`。反例 `[5,1,4,null,null,3,6]`：4 的直接左右孩子合法，但它位于 5 的右子树却比 5 小，实际不是 BST。
5. 正确校验两种做法：一是在递归时携带开区间 `(low, high)`，每深入一层就收紧一侧边界；二是中序遍历，只要发现某值 ≤ 前一个值就返回 `false`，代码最短且只需保留"上一个值"一个变量。
6. **复杂度与边界**：LCA 时间 O(n)、空间 O(h)；BST 校验 O(n)/O(h)；BST 查找平均 O(log n)、最坏 O(n)（插入有序数据退化成链），迭代写法空间 O(1)。边界：`p` 或 `q` 不在树中时上述写法可能返回错误节点，需按题意先确认存在性；BST 查找要注意空树。

```js
// 最近公共祖先：后序上收，两侧各有一个则当前节点即 LCA
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root; // 命中或到底
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left || right;                    // 否则把找到的那个继续上抛
}
// 校验 BST：区间法，节点值必须严格落在 (low, high) 内
function isValidBST(root, low = -Infinity, high = Infinity) {
  if (!root) return true;
  if (root.val <= low || root.val >= high) return false;
  return isValidBST(root.left, low, root.val) && isValidBST(root.right, root.val, high);
}
// 查找：迭代下沉，避免递归栈
function searchBST(root, target) {
  let cur = root;
  while (cur) {
    if (cur.val === target) return cur;
    cur = target < cur.val ? cur.left : cur.right;
  }
  return null;
}
```

**追问与易错点**：

- 追问：BST 插入和删除哪个麻烦？答：删除麻烦。删除有两个孩子的节点时，要用**中序后继**（右子树最小值）或中序前驱替换它，再递归删除后继节点，保持 BST 性质。
- 追问：为什么不用"从根往下记路径再比最后一个公共节点"？答：那样要 O(n) 额外空间存路径；一次后序遍历只需 O(h) 递归栈，是面试更想看到的解法。
- 陷阱：BST 校验把"左孩子 < 根 < 右孩子"当成条件，`[5,1,4,null,null,3,6]` 这类用例会判错，这是最经典的翻车点。

### Q17 Top K 问题怎么做？堆和快排两种解法怎么取舍？

**考察点**：考堆（Heap）的使用场景与"部分排序"思想，以及 `O(n log k)` 与 `O(n)` 期望两种方案的选择依据。

**参考答案**：

> **一句话结论**：求前 K 大用**容量为 K 的小顶堆**——堆顶是当前 K 个里的最小值，新元素比堆顶大就替换堆顶并下沉，遍历完堆里就是前 K 大；时间 O(n log k)、空间 O(k)，适合海量数据流。

1. 为什么"前 K 大"用小顶堆：需要随时淘汰"当前最小的候选"。小顶堆能在 O(1) 看到最弱者、O(log k) 完成替换；求前 K 小则反过来用大顶堆。
2. 建堆细节：先把前 K 个元素建堆，再遍历剩余元素。若"先全部入堆再弹出 n-k 次"，会退化成 O(n log n)，不是最优。
3. 复杂度对比：堆解法 O(n log k) 时间、O(k) 空间，**不要求全量数据驻留内存**，可处理数据流/超大数据；快排分区（Quickselect）解法期望 O(n)、最坏 O(n²)，只需 O(1) 额外空间但必须能随机访问全部数据。
4. 选择依据：数据量大、流式、内存受限、K 远小于 n → 堆；数据已在内存、只求一次、追求平均最快 → Quickselect（它会打乱元素顺序，若不允许修改原数组要先拷贝）。
5. JS 里没有内置优先队列，要手写堆（数组 + 上浮/下沉）；工程中若只是"取最大几个"且 n 不大，直接 `sort((a,b)=>b-a).slice(0,k)` 反而更快更简单。
6. **边界条件**：`k <= 0` 返回空数组，`k >= n` 返回整个数组；数组有重复值时"前 K 大"通常允许重复计数，若要去重需先 `Set`；堆的下沉循环要防止 `l`/`r` 越界。

```js
// 前 K 大：容量 k 的小顶堆（堆顶是当前第 k 名，便于淘汰）
function topK(arr, k) {
  if (k <= 0) return [];
  if (k >= arr.length) return arr.slice();
  const heap = arr.slice(0, k).sort((a, b) => a - b); // 简化：用小顶堆数组
  for (let i = k; i < arr.length; i++) {
    if (arr[i] <= heap[0]) continue;                   // 不比最弱者大就跳过
    let p = 0;                                         // 替换堆顶后下沉恢复堆序
    heap[p] = arr[i];
    while (true) {
      const l = 2 * p + 1, r = l + 1;
      let min = p;
      if (l < k && heap[l] < heap[min]) min = l;
      if (r < k && heap[r] < heap[min]) min = r;
      if (min === p) break;
      [heap[p], heap[min]] = [heap[min], heap[p]];
      p = min;
    }
  }
  return heap; // 堆内即前 k 大（无序）
}
```

**追问与易错点**：

- 追问：为什么求前 K 大用小顶堆而不是大顶堆？答：大顶堆堆顶是最大值，无法判断"新元素该不该进来"；只有小顶堆的堆顶才是"当前第 K 名"，便于淘汰。
- 追问：堆的上浮与下沉分别用在哪？答：插入元素时上浮（和父节点比），删除堆顶时把末尾元素移到堆顶再下沉（和孩子比）。建堆时从最后一个非叶子节点开始逐个下沉，可在 O(n) 内完成。
- 陷阱：说"建堆需要 O(n log n)"是错的——自底向上建堆是 O(n)，堆排序整体才是 O(n log n)。

### Q18 动态规划入门：爬楼梯、最大子数组和、打家劫舍、最长递增子序列怎么做？

**考察点**：考 DP 的状态定义、转移方程推导与空间优化，是算法面试区分度最高的一题。

**参考答案**：

> **一句话结论**：动态规划（Dynamic Programming）三步走——**定义状态（dp[i] 表示什么）、写转移方程（dp[i] 由哪些更小状态推来）、定初始条件与遍历顺序**；能用滚动变量把空间从 O(n) 压到 O(1) 是常见加分点。

1. 爬楼梯：`dp[i]` 表示爬到第 i 阶的方法数，`dp[i] = dp[i-1] + dp[i-2]`，初始 `dp[1]=1, dp[2]=2`。本质是斐波那契数列，用两个变量滚动即可把空间降到 O(1)。
2. 最大子数组和（Kadane 算法）：`dp[i]` 表示"以 i 结尾的最大连续子数组和"，`dp[i] = max(nums[i], dp[i-1] + nums[i])`——要么自己另起一段，要么接上前面的。答案是所有 `dp[i]` 的最大值。
3. 打家劫舍：`dp[i] = max(dp[i-1], dp[i-2] + nums[i])`——不偷第 i 家就沿用前一家，偷则与 i-1 互斥；同样可用滚动变量优化到 O(1) 空间。
4. 最长递增子序列（LIS）：基础解法 `dp[i]` 表示"以 i 结尾的 LIS 长度"，`dp[i] = max(dp[j]) + 1 (j < i 且 nums[j] < nums[i])`，时间 O(n²)、空间 O(n)。优化解用"贪心 + 二分"的 `tails` 数组（`tails[k]` 表示长度 k+1 的递增子序列的最小结尾值），时间 O(n log n)。
5. 0-1 背包：`dp[i][j] = max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])`；压缩成一维后**容量必须倒序遍历**，否则同一物品会被重复使用（那就变成完全背包了）。
6. **复杂度与边界**：爬楼梯 O(n)/O(1)、最大子数组和 O(n)/O(1)、打家劫舍 O(n)/O(1)、LIS 基础 O(n²)/O(n) 或优化 O(n log n)/O(n)、背包 O(n·capacity)/O(capacity)。边界：空数组返回 0；LIS 的答案不是 `dp[n-1]` 而是 `max(dp)`；`nums` 全为负数时最大子数组和就是最大的那个负数。

```js
// 爬楼梯：滚动变量，O(n) 时间 O(1) 空间
function climbStairs(n) {
  let prev = 1, cur = 1;               // dp[0]=1, dp[1]=1
  for (let i = 2; i <= n; i++) [prev, cur] = [cur, prev + cur]; // dp[i]=dp[i-1]+dp[i-2]
  return cur;
}
// 最大子数组和：Kadane，dp[i] = max(nums[i], dp[i-1] + nums[i])
function maxSubArray(nums) {
  if (!nums.length) return 0;          // 空数组边界：返回 0 而不是 undefined
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]); // 另起一段 or 接上前面
    best = Math.max(best, cur);
  }
  return best;
}
// 0-1 背包：一维压缩后容量必须倒序，保证每件物品只用一次
function knapsack(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++)
    for (let j = capacity; j >= weights[i]; j--) dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
  return dp[capacity];
}
```

**追问与易错点**：

- 追问：怎么判断一道题能不能用 DP？答：两个特征——**最优子结构**（大问题最优解由子问题最优解构成）和**重叠子问题**（递归会重复计算同一状态）。缺少重叠子问题就只是分治，用备忘录没收益。
- 追问：状态转移方程怎么推？答：先想"最后一步决策是什么"，把所有可能的选择枚举出来，再对每种选择写出"它依赖哪个更小的状态 + 这一步的收益"，取 `max`/`min`/累加。用暴力递归写出来、加备忘录、再改迭代——这是最稳的推导路径。
- 陷阱：LIS 返回 `dp[n-1]` 而不是 `max(dp)`；0-1 背包一维压缩时正序遍历容量，把物品用了多次导致答案偏大。

### Q19 贪心怎么用？分发饼干、跳跃游戏为什么贪心是对的？

**考察点**：考贪心的适用条件（局部最优能否推出全局最优）与"用交换论证说明为什么贪心成立"的表达能力。

**参考答案**：

> **一句话结论**：贪心在每一步都取当前看起来最优的选择，且**不回溯**；它成立的前提是问题具备"贪心选择性质"——必须能证明局部最优可以推出全局最优。分发饼干和跳跃游戏都满足这个前提。

1. 贪心 vs 动态规划：贪心每一步只保留一个决策、不回头，时间通常 O(n log n) 或 O(n)；DP 会枚举所有可能并比较，更稳但更慢，且能处理贪心失效的问题（如 0-1 背包按性价比贪心就是错的）。
2. 分发饼干（Assign Cookies）：两组都升序排序，双指针从最小的孩子和最小的饼干开始——饼干够就喂这个孩子、两指针都前进，不够就换更大的饼干。贪心依据：用能满足的最小饼干去满足最小胃口的孩子，能最大化剩余资源。
3. 跳跃游戏（Jump Game）：维护 `maxReach` 表示当前能到达的最远下标，遍历时若 `i > maxReach` 说明卡住返回 `false`，否则更新 `maxReach = max(maxReach, i + nums[i])`。
4. 跳跃游戏 II（求最少步数）：在"当前步能覆盖的区间"内找出下一跳的最远边界，走到边界就 `steps++` 并更新边界。本质是 BFS 分层，但用 O(1) 空间实现。
5. 贪心为什么对（交换论证）：若最优解的第一步与贪心选择不同，可以把最优解的第一步替换成贪心选择而不使结果变差，反复替换即可得出"贪心解也是最优解"。能说出这个论证框架是加分点。
6. **复杂度与边界**：分发饼干 O(n log n)（排序主导）+ O(1) 空间，跳跃游戏 O(n)/O(1)。边界：空数组、只有一个元素；跳跃游戏起点必须可达（`nums[0] = 0` 且长度 > 1 时直接返回 `false`）；其他经典贪心还有区间调度（按结束时间排序）与合并区间（按起始排序）。

```js
// 分发饼干：两组升序 + 双指针，用最小饼干满足最小胃口
function findContentChildren(g, s) {
  g.sort((a, b) => a - b);
  s.sort((a, b) => a - b);
  let child = 0, cookie = 0;
  while (child < g.length && cookie < s.length) {
    if (s[cookie] >= g[child]) child++;  // 满足了这个孩子
    cookie++;                            // 这块饼干无论用没用都往后走
  }
  return child;
}
// 跳跃游戏：维护最远可达，遍历到不可达位置即失败
function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;      // 当前位置不可达，卡住
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }
  return true;
}
```

**追问与易错点**：

- 追问：零钱兑换用贪心对吗？答：不一定。只有币值互相成倍数关系（如 1、5、10、25 这类典型币制）贪心才成立；否则要用 DP 求最少硬币数。这是贪心的经典反例。
- 追问：分发饼干为什么要排序？答：把"最小饼干配最小胃口"变成可比较的顺序扫描，避免用大饼干浪费在小胃口孩子身上；不排序无法保证局部最优的顺序性。
- 陷阱：把贪心和 DP 混为一谈，或者声称"贪心总是更优"。贪心的优势是快，代价是适用范围窄且必须能证明，证不出来就该换 DP。

### Q20 只出现一次的数字、位计数、位运算技巧，前端面试会问吗？

**考察点**：考异或（XOR）的性质与位运算基础，这类题代码极短但能分辨基础是否扎实。

**参考答案**：

> **一句话结论**：异或有三条性质——`a ^ a = 0`、`a ^ 0 = a`、满足交换律与结合律，所以全部元素异或一遍，成对出现的会互相抵消，剩下的就是只出现一次的数字；时间 O(n)、空间 O(1)。

1. 只出现一次的数字：`reduce((acc, n) => acc ^ n, 0)` 一行解决。相比"用哈希表统计次数"，省掉 O(n) 空间，这是最常被追问的对比点。
2. 变体：其余元素出现三次用位计数（统计每一位上 1 的个数对 3 取模）；有两个只出现一次的数字时，先整体异或得到 `x ^ y`，取其最低位的 1 作为分组依据把数组分成两组，各自异或即得两个数。
3. 位计数（Counting Bits）：求 0 到 n 每个数的二进制中 1 的个数，用 DP：`dp[i] = dp[i >> 1] + (i & 1)`，时间 O(n)。
4. 常用位运算技巧：`n & 1` 判奇偶（比 `n % 2` 对负数更安全）；`n & (n - 1)` 消掉最低位的 1（可数 1 的个数、判是否为 2 的幂：`n > 0 && (n & (n-1)) === 0`）；`n & -n` 取最低位的 1。
5. 交换两个数：`a ^= b; b ^= a; a ^= b;`（无需临时变量）。但现代工程里**不推荐**这样写，可读性差且对同一变量自交换会归零，属于炫技题而非生产写法。
6. **复杂度与边界**：只出现一次的数字 O(n)/O(1)；位计数 O(n)/O(n)（可优化到 O(1) 只需返回数组）。边界：`reduce` 必须显式传初始值 `0`，否则空数组会抛 `TypeError: Reduce of empty array with no initial value`（不是返回 `undefined`）；JS 位运算会把操作数转成 **32 位有符号整数**，`1 << 31` 是负数 `-2147483648`，超过 2³¹ 的值要用 `Math.floor(n / 2)` 或 `>>> 0`。

```js
// 只出现一次的数字（其余都出现两次）：全部异或，成对的互相抵消
const singleNumber = (nums) => nums.reduce((acc, n) => acc ^ n, 0);
// 位计数：0..n 每个数的二进制 1 的个数
function countBits(n) {
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1); // 右移一位的 1 个数 + 最低位
  return dp;
}
// 交换两个数（原理演示，可读性差，生产不推荐）
let a = 3, b = 5;
a ^= b; b ^= a; a ^= b;          // a=5, b=3
```

**追问与易错点**：

- 追问：`n & (n - 1)` 为什么能消掉最低位的 1？答：减 1 会把最低位的 1 变成 0、其右侧的 0 全变成 1，与原数做与运算后，该位及其右侧全归零，等价于抹掉最低位的 1。
- 追问：`nums.reduce((a, b) => a ^ b)` 对空数组返回什么？答：直接抛 `TypeError: Reduce of empty array with no initial value`（空数组且未传初始值时 `reduce` 是报错，不是返回 `undefined`），所以必须显式传 `0` 作为初始值，这也是常见的小陷阱。
- 陷阱：用 `<<` 处理超过 32 位的数值，结果静默错误；JS 里安全整数范围是 `Number.MAX_SAFE_INTEGER`（2⁵³-1），再大要用 `BigInt`。

### Q21 前端真实业务算法：树形结构与扁平数组怎么互转？

**考察点**：这是前端最常考的"业务算法"——权限菜单、组织架构、级联选择器都要用；考递归、哈希优化与删除引用字段的细节。

**参考答案**：

> **一句话结论**：扁平转树用"一次遍历建 id → 节点映射，再一次遍历挂接父子"的哈希法，时间 O(n) 远优于对每层反复筛选的 O(n²)；树转扁平用 DFS 递归，携带父 id 与层级信息。

1. 哈希建树两步：① 遍历一次，把每项包成 `{ ...item, children: [] }` 存入 `Map`；② 遍历一次，有 `parentId` 且父节点存在就挂到 `parent.children`，否则作为根节点。全程不嵌套查找。
2. 常见错误写法：对每个节点执行 `list.filter(x => x.parentId === node.id)` 来递归找孩子，时间复杂度 O(n²)，几千条数据就会明显卡顿——面试官很爱追问这里。
3. 树转扁平：DFS 前序递归，把节点压入结果数组时剔除 `children` 字段，并记录 `parentId` 与 `level`。
4. **复杂度与边界**：扁平转树 O(n) 时间、O(n) 空间；树转扁平 O(n) 时间、O(h) 递归栈。边界：数据里存在"孤儿节点"（父 id 找不到）时应作为根节点或收集到异常列表，不能静默丢弃；数据可能有多棵树（森林），结果是数组而不是单根对象；`parentId === rootId` 要单独判断，否则根节点会被挂到虚拟根上形成环。
5. 前端真实坑：直接改原对象会污染上游数据，所以要浅拷贝；很多 UI 组件（如 `el-tree`）对空 `children` 仍会渲染展开箭头，所以常在末尾把空 `children` 删掉。
6. 反向场景：级联选择器拿到的是选中节点的 id 数组，需要根据 `parentId` 链向上回溯出完整路径，本质是"用 Map 反查父节点"的向上遍历。

```js
// 扁平 -> 树：O(n) 哈希法（res 为根节点集合，支持森林）
function listToTree(list, rootId = null) {
  const map = new Map(), res = [];
  for (const item of list) map.set(item.id, { ...item, children: [] }); // 先建映射
  for (const item of list) {
    const node = map.get(item.id), parent = map.get(item.parentId);
    // 自引用（parentId === id）要按根处理，否则会被静默丢弃并形成自环
    if (parent && item.parentId !== rootId && item.parentId !== item.id) parent.children.push(node);
    else res.push(node);                       // 无父或父为根 => 森林的根
  }
  return res;
}
// 树 -> 扁平：DFS 携带父 id 与层级
function treeToList(tree, parentId = null, level = 0, out = []) {
  for (const node of tree) {
    const { children, ...rest } = node;        // 剔除 children
    out.push({ ...rest, parentId, level });
    if (children && children.length) treeToList(children, node.id, level + 1, out);
  }
  return out;
}
```

**追问与易错点**：

- 追问：为什么推荐 `Map` 而不是普通对象做映射？答：`Map` 的 key 支持任意类型且没有原型链污染（`id` 恰好叫 `constructor` 时普通对象会出错），`get`/`set` 也是 O(1)。
- 追问：树很深（几万层）怎么办？答：递归会爆栈，改成"显式栈 + while 循环"的迭代 DFS，或分片处理（`requestIdleCallback` / 虚拟滚动），避免长任务阻塞主线程。
- 陷阱：`list.filter(x => x.parentId === id)` 的 O(n²) 写法；忘记 `parentId === rootId` 判断导致根节点被挂到虚拟根上形成环。

### Q22 前端真实业务算法：对象深比较和两个数组 diff 怎么写？

**考察点**：考递归比较的完备性（循环引用、`NaN`、`Date`），以及"对象数组必须按业务主键比较"这一现实约束。

**参考答案**：

> **一句话结论**：深比较先比引用与类型，再分情况处理日期、正则、`Map/Set`，最后递归比较自有可枚举键，并用 `WeakMap` 记录已访问对象处理循环引用；数组 diff 要按业务主键建 `Map`，输出"新增 / 删除 / 修改"三类差异，不能直接比较对象引用。

1. 深比较的快速失败：`a === b` 直接 `true`（覆盖同一引用与原始值）；`NaN === NaN` 是 `false`，要用 `Number.isNaN` 特判；一方为 `null`/非对象则判定不等。
2. 类型检查：用 `Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)` 判断"不同构造函数的实例不等"，避免把 `[]` 和 `{}` 混为一谈。
3. 分类型处理：`Date` 比 `getTime()`；`RegExp` 比 `source` 与 `flags`；数组先比 `length` 再逐项递归；对象先比键数量再逐键递归。`Map`/`Set` 需要双向检查元素存在性。
4. 循环引用：用 `WeakMap` 存"正在比较的对象对"，命中就直接返回 `true`，切断无限递归；用 `WeakMap` 而非 `Map` 是为了不阻止对象被 GC。
5. 原始值差集：`a.filter(x => !setB.has(x))`，把内层 O(m) 的 `includes` 降到 O(1)，整体从 O(n·m) 降到 O(n+m)；对称差集就是把两个方向的结果拼起来。
6. **复杂度与边界**：深比较时间 O(节点数)、空间 O(深度 + 已访问对)；差集 O(n+m)。边界：`{a:1}` 与 `{b:1}` 必须判不等（要比键名集合而不只是值）；`Set` 对对象数组无效（按引用比较）；对象数组 diff 要按 `id` 而不是引用。

```js
// 深比较：比引用 -> 比类型 -> WeakMap 防循环引用 -> 递归比键与值
function deepEqual(a, b, seen = new WeakMap()) {
  if (a === b) return true;
  if (Number.isNaN(a) && Number.isNaN(b)) return true;   // NaN 特判
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (seen.get(a) === b) return true;                    // 循环引用已比较过
  seen.set(a, b);
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags; // 正则比 source + flags
  if (a instanceof Map || a instanceof Set) {   // Map/Set 的内容不在自有属性上，必须按元素双向查存在性
    if (a.size !== b.size) return false;
    const eb = [...b];
    return [...a].every((x) => eb.some((y) => deepEqual(x, y, seen)));
  }
  const ka = Reflect.ownKeys(a), kb = Reflect.ownKeys(b);
  return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k], seen));
}
// 对象数组 diff：按 id 建索引，输出新增 / 删除 / 修改
function diffById(prev, next) {
  const prevMap = new Map(prev.map((i) => [i.id, i]));
  const added = [], updated = [], nextIds = new Set();
  for (const item of next) {
    nextIds.add(item.id);
    const old = prevMap.get(item.id);
    if (!old) added.push(item);                            // 新增
    else if (JSON.stringify(old) !== JSON.stringify(item)) updated.push(item); // 修改
  }
  return { added, updated, removed: prev.filter((i) => !nextIds.has(i.id)) };
}
```

**追问与易错点**：

- 追问：`JSON.stringify` 比对的坑有哪些？答：键顺序不同会判不等；`undefined`、函数、`Symbol` 会被丢弃；`Date` 被转成字符串失去类型；循环引用直接抛错；`NaN` 变 `null`。
- 追问：为什么不用 `JSON.stringify` 做整体 diff？答：它只能判"整体是否相同"，拿不到"哪个字段变了"，也无法区分新增与删除，只适合做廉价的"是否变化"判断。
- 陷阱：只递归比较"值"却忘记比较**键名集合**，导致 `{a:1}` 与 `{b:1}` 被判相等；`a.filter(x => !b.includes(x))` 在几千条数据时明显卡顿。

### Q23 前端真实业务算法：多字段排序与中文排序、版本号比较怎么做？

**考察点**：考复合比较器的写法、中文拼音排序与 UTF-16 编码排序的差异，以及版本号必须转数字比较这一细节。

**参考答案**：

> **一句话结论**：多字段排序用一个"逐字段比较、首个不等即返回"的复合比较器；中文排序必须用 `localeCompare('zh-Hans-CN', { numeric: true })` 或复用的 `Intl.Collator`，直接用 `<` 会按 UTF-16 码元排序；版本号按 `.` 切段后必须转数字比较，否则 `'10' < '9'` 成立。

1. 复合比较器骨架：遍历排序字段列表，逐字段取值比较；结果非 0 就按该字段的 `order` 乘上方向系数返回，全相等返回 0。比较器**必须返回数字**，返回 `true/false` 会被转成 `1/0`，永远给不出负数。
2. 中文排序原理：JS 的 `'张' < '李'` 比较的是 UTF-16 码元值，与拼音无关；`localeCompare` 走国际化排序规则（按汉语拼音），`{ numeric: true }` 还能让 `"file10"` 排在 `"file2"` 之后（自然排序）。
3. 性能要点：`Intl.Collator` 的实例化开销大，必须在排序函数**外面**创建一次并复用 `collator.compare`；每次比较都 `new Intl.Collator()` 会慢几十倍。
4. `sort` 稳定性（ES2019 起规范保证）意味着"先按次要字段排一次、再按主要字段排一次"也能得到多字段结果，但复合比较器只需一次排序、语义更直白。
5. 版本号比较：先用 `-` 拆出预发布标识，主版本再按 `.` 切分并 `map(Number)`，缺失段补 0，逐段比较首个不等即返回；要剥掉 `v` 前缀。**注意**`map(Number)` 会把 `'0-beta'` 变成 `NaN` 导致比较失效，所以预发布标识必须切开后单独判断——按语义化版本（SemVer）规则，带预发布标识的版本**小于**对应正式版本。
6. **复杂度与边界**：排序 O(n log n·字段数)、空间 O(n)（`[...list]` 拷贝）；版本号 O(段数)、空间 O(段数)。边界：`null`/`undefined` 参与比较会得到 `NaN` 导致结果不可预测，要先归一化；空数组、单元素数组要能直接返回；`1.0` 与 `1.0.0` 按补 0 规则判等。

```js
// 多字段排序：逐字段比较，首个不等字段决定顺序（collator 只建一次）
const collator = new Intl.Collator('zh-Hans-CN', { numeric: true });
function multiSort(list, fields) {
  return [...list].sort((a, b) => {
    for (const { key, order = 'asc' } of fields) {
      const va = a[key] ?? '', vb = b[key] ?? '';       // 空值归一化
      const r = typeof va === 'string' || typeof vb === 'string'
        ? collator.compare(String(va), String(vb))
        : (va > vb ? 1 : va < vb ? -1 : 0);
      if (r !== 0) return r * (order === 'desc' ? -1 : 1);
    }
    return 0;                                           // 全相等：保持稳定次序
  });
}
// 版本号比较：先拆预发布标识，再逐段比数字；预发布小于正式版
function compareVersion(v1, v2) {
  const [c1, pre1] = String(v1).replace(/^v/i, '').split('-');
  const [c2, pre2] = String(v2).replace(/^v/i, '').split('-');
  const a = c1.split('.').map(Number), b = c2.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;   // 缺失段补 0
    if (x !== y) return x > y ? 1 : -1;
  }
  if (pre1 === pre2) return 0;
  return !pre1 ? 1 : !pre2 ? -1 : (pre1 > pre2 ? 1 : -1);
}
```

**追问与易错点**：

- 追问：为什么 `'10' < '9'` 是 `true`？答：字符串按 UTF-16 码元逐位比较，`'1'` 的码元小于 `'9'`，所以字典序判定为小；版本号与数字比较必须先转数字。
- 追问：`localeCompare` 和 `Intl.Collator` 怎么选？答：只排少量数据用 `localeCompare` 更省事；排序字段固定且数据量大时用 `Intl.Collator` 复用实例，性能明显更好。
- 陷阱：中文排序直接用 `a.name > b.name ? 1 : -1`；版本号用字符串比较；不先切出预发布标识就用 `map(Number)` 解析，`'0-beta'` 变成 `NaN` 让整段比较静默失效。

### Q24 前端真实业务算法：区间合并、会议时间冲突检测、时间格式化怎么做？

**考察点**：考排序 + 区间扫描这一通用模式，以及时间点比较、跨天、相邻区间是否合并等业务边界。

**参考答案**：

> **一句话结论**：区间合并先按**起始时间升序排序**，再线性扫描：若当前区间起点 ≤ 上一个合并区间的终点就合并（终点取两者最大），否则另起一段；时间 O(n log n)、空间 O(n)。

1. 为什么必须先排序：只有按起点有序，才能保证"当前区间一定与已有结果里最后一段相邻"，从而只需比较最后一次结果，不需要回头检查。
2. 合并判定：`cur.start <= last.end` 就合并，`last.end = max(last.end, cur.end)`。**取 max 不能省**——`[1,10]` 与 `[2,3]` 合并时若直接取 `cur.end`，结果会被错误截短为 `[1,3]`。
3. 相邻不算重叠：`[1,2]` 与 `[2,3]` 是否合并取决于业务（"紧邻的两个会议"通常不算冲突），所以判定用 `<=` 还是 `<` 要按需求定，这是最常被追问的细节。冲突检测的通用式子是两个区间是否满足 `a.start < b.end && b.start < a.end`。
4. 时间比较：统一转成时间戳（`Date.parse` 或 `getTime()`）比较最稳；`'09:00'` 这种纯时间字符串不能直接做算术，直接按字典序比大小也只对补零且同一天的时间成立，跨天或漏补零（如 `'9:00'` 与 `'10:00'`）就会错，要么补上日期、要么切成"当天分钟数"。
5. **复杂度与边界**：排序 O(n log n) 是瓶颈，扫描本身 O(n)，空间 O(n)（结果数组）。边界：空数组与单区间要直接返回；不要原地修改传入数组（`sort` 与 `last[1] = ...` 都会改），要浅拷贝；时间格式化要注意 `getMonth()` 从 0 开始、`new Date('2024-01-01')` 按 UTC 解析而 `new Date('2024/01/01')` 按本地时区解析，跨时区会差一天。
6. 业务延伸：日程表空闲时段 = 合并后的忙碌区间的补集；甘特图按资源分组后各自合并。

```js
// 合并区间（会议时间合并）：intervals = [[1,3],[2,6],[8,10],[15,18]]
function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals.slice();
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]); // 按起点升序
  const res = [sorted[0].slice()];
  for (let i = 1; i < sorted.length; i++) {
    const last = res[res.length - 1], cur = sorted[i];
    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]); // 重叠须取最大终点
    else res.push(cur.slice());                                // 无重叠，另起一段
  }
  return res;
}
// 判断两个区间是否重叠（会议冲突检测）
const isOverlap = (a, b) => a[0] < b[1] && b[0] < a[1];
// 相对时间：Intl.RelativeTimeFormat 免去手写补零与月份偏移
const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
const minutesAgo = (m) => rtf.format(-m, 'minute'); // "3 分钟前"
```

**追问与易错点**：

- 追问：为什么不拷贝就直接改 `intervals` 里的元素？答：`sort` 与 `last[1] = ...` 都会修改传入的数组，会污染调用方数据（React 里还可能因为引用不变导致不重渲染），所以要先浅拷贝。
- 追问：怎么求"空闲时间"？答：把所有忙碌区间合并后，在相邻两段之间取空隙；注意处理一天/一周的边界（首段之前与末段之后也算空闲）。
- 陷阱：合并时只更新 `last.end = cur.end` 而不取 `max`，遇到被包含的区间结果就会变短；把 `'09:00'` 当通用可比较的时间戳做跨天运算。

### Q25 前端真实业务算法：URL 参数解析与序列化、模板字符串变量替换怎么做？

**考察点**：考 URL 编解码、边界字符处理，以及模板替换的安全性；能说清"为什么不该手写正则解析完整 URL"才算过关。

**参考答案**：

> **一句话结论**：解析用 `new URLSearchParams`（或 `URL` 对象取 `searchParams`），它能正确处理编码、重复键与特殊字符；序列化用 `params.toString()`，手写拼接必须过一遍 `encodeURIComponent`；模板替换用 `/\{\{\s*(\w+)\s*\}\}/g` 配 `replace` 回调，绝不用 `eval`。

1. `URLSearchParams` 的优势：自动解码 `%20`/`+`、支持 `append` 保留重复键、`getAll` 拿到同名参数的数组；手写 `split('&')` + `split('=')` 在值里含未编码的 `=` 或 `&` 时会切错。
2. 重复键的处理差异：`get('a')` 只返回**第一个**，`getAll('a')` 返回全部；所以 `a=1&a=2` 这种多选框参数必须用 `getAll`，这是最常见的漏判。
3. 构造查询串：`new URLSearchParams({ a: 1, b: '中 文' }).toString()` 会自动编码为 `a=1&b=%E4%B8%AD+%E6%96%87`（空格在表单编码里是 `+`）；数组参数要循环 `append`。
4. 取完整信息要用 `URL` 对象：`new URL(location.href)` 能拿到 `protocol`/`host`/`pathname`/`hash`；注意 `hash` 里的参数（`#/path?id=1`）不会进 `searchParams`，单页应用要手动从 `hash` 里再解析一次。
5. 模板替换：`tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => data[k] ?? '')`。必须用**回调函数**形式——若第二个参数传字符串，变量值里的 `$&`、`$1` 会被当成替换模式产生意外输出。绝不能用 `new Function`/`eval`，模板内容一旦来自用户输入就是远程代码执行（RCE）漏洞。
6. **复杂度与边界**：解析与序列化都是 O(参数字符数)、空间 O(k)（k 为参数个数）。边界：手写解析要 `try/catch` 包住 `decodeURIComponent`（用户手改地址栏出现单独的 `%` 会抛 `URIError`）；空值参数 `?a=` 要保留为空字符串而非 `undefined`；`encodeURI` 不编码 `:/?#[]@` 适合整条 URL，`encodeURIComponent` 会编码它们、适合单个参数值。

```js
// 解析：支持重复键（a=1&a=2 返回数组）
function parseQuery(url) {
  const params = new URL(url, location.origin).searchParams;
  const res = {};
  for (const key of new Set(params.keys())) {   // 去重键名
    const all = params.getAll(key);
    res[key] = all.length > 1 ? all : all[0];
  }
  return res;
}
// 序列化：自动编码，跳过空值，数组展开为重复键
function stringifyQuery(obj) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) v.forEach((item) => params.append(k, item));
    else params.append(k, v);
  }
  return params.toString();
}
// 模板变量替换：只替换已知键，未提供则保留原样（禁止 eval）
function render(tpl, data) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (raw, k) =>
    Object.prototype.hasOwnProperty.call(data, k) ? String(data[k]) : raw);
}
// render('你好 {{ name }}，共 {{n}} 条', { name: '刘群', n: 3 })
```

**追问与易错点**：

- 追问：`encodeURI` 和 `encodeURIComponent` 有什么区别？答：`encodeURI` 不编码 `:/?#[]@` 等 URL 结构字符，适合编码整条 URL；`encodeURIComponent` 会把它们也编码，适合编码单个参数值。拼参数时用错了会导致分隔符被转义。
- 追问：`location.search` 里 `+` 代表什么？答：在 `application/x-www-form-urlencoded` 语义下 `+` 代表空格；`URLSearchParams` 会把它解成空格，手写 `decodeURIComponent` 不会，两者结果不一致。
- 陷阱：用正则 `/[?&]([^&]+)=([^&]*)/g` 解析完整 URL，遇到 `#hash` 里的 `?`、值里未编码的 `&`、path 中的 `?` 都会解析错；用 `replace` 传字符串导致 `$&` 被特殊处理。

### Q26 前端真实业务算法：大数相加、千分位格式化、驼峰下划线互转怎么做？

**考察点**：考 JS 精度边界意识与字符串处理基本功；这三题体量小、出现频率高，是"送分题"也是"送命题"。

**参考答案**：

> **一句话结论**：超过 `Number.MAX_SAFE_INTEGER`（2⁵³-1）的整数必须用 `BigInt` 或字符串逐位相加；千分位可以用 `toLocaleString` 或 `Intl.NumberFormat`，但要注意保留小数位；驼峰与下划线互转核心是正则 + 回调替换。

1. 大数相加（字符串版）：从末位开始逐位相加，带上进位 `carry`，结果前插到结果字符串；两个数长度不同时短的按 0 补齐。
2. 大数相加的现实选择：现代浏览器直接用 `BigInt` 最省事——`BigInt('9007199254740993') + 1n`；但 `BigInt` 不能与 `Number` 混算，且 `JSON.stringify` 会直接抛 `TypeError`，序列化前要转字符串。手写逐位相加考的是算法功底，`BigInt` 考的是 API 熟悉度，两者都答上最好。
3. 千分位格式化：`(1234567.891).toLocaleString('zh-CN', { minimumFractionDigits: 2 })` 最稳；手写正则 `n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')` 要注意该正则只作用于小数点前的部分。
4. 反解析：去掉逗号再 `parseFloat`；还要处理货币符号时用 `Number(str.replace(/[^\d.-]/g, ''))` 兜底。
5. 驼峰与下划线互转：下划线转小驼峰 `str.replace(/_(\w)/g, (_, c) => c.toUpperCase())`；驼峰转下划线用 `/([a-z\d])([A-Z])/g` 配 `'$1_$2'` 再 `toLowerCase()`，它只在"小写字母后紧跟大写字母"处断词，所以 `getHTTPCode` 得到 `get_httpcode`；若改用 `/([A-Z])/g` 就会把连续的每个大写字母都断开，得到 `get_h_t_t_p_code`。
6. **复杂度与边界**：三者都是 O(n) 时间、O(n) 空间。边界：`0.1 + 0.2 !== 0.3`（IEEE 754 二进制浮点无法精确表示），金额应转成整数分再算或使用 decimal.js；大数相加结果要去掉前导 0；负数与大数混算要先判符号。

```js
// 大数相加：字符串逐位相加（不使用 BigInt）
function addStrings(a, b) {
  let i = a.length - 1, j = b.length - 1, carry = 0, res = '';
  while (i >= 0 || j >= 0 || carry) {
    const sum = (+a[i--] || 0) + (+b[j--] || 0) + carry; // 越界按 0 处理
    res = (sum % 10) + res;      // 当前位前插
    carry = sum >= 10 ? 1 : 0;   // 进位
  }
  return res.replace(/^0+(?=\d)/, ''); // 去掉前导 0
}
// 千分位格式化（保留两位小数）
const thousands = (n) => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// 下划线 <-> 小驼峰
const toCamel = (s) => s.replace(/_(\w)/g, (_, c) => c.toUpperCase());
const toSnake = (s) => s.replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase();
```

**追问与易错点**：

- 追问：为什么 `0.1 + 0.2 !== 0.3`？答：IEEE 754 双精度浮点用二进制表示小数，0.1 与 0.2 都是无限循环小数只能近似存储，相加后误差累积。金额计算应转成整数分再算，或使用 decimal.js 之类的库。
- 追问：`BigInt` 有什么使用限制？答：不能与 `Number` 混合运算（抛 `TypeError`）、`Math` 系列方法不支持、`JSON.stringify` 会抛错；要序列化得自定义 `toJSON` 或转成字符串。
- 陷阱：千分位正则写成 `/\d{3}/g` 会把 `1234` 变成 `,1,234`；驼峰转下划线用 `/([A-Z])/g` 处理 `getHTTPCode` 得到 `get_h_t_t_p_code`，与后端约定不符。

### Q27 前端真实业务算法：虚拟列表的可见区间怎么算？

**考察点**：考"固定行高虚拟滚动"的核心公式与缓冲区设计，是长列表性能优化的必考题，也是本类题里唯一的困难题。

**参考答案**：

> **一句话结论**：固定行高时，`start = Math.floor(scrollTop / itemHeight)`、`visibleCount = Math.ceil(containerHeight / itemHeight)`，渲染区间取 `[start - buffer, start + visibleCount + buffer]`，并用 `transform: translateY(startIndex * itemHeight)` 撑出正确位置。

1. 三要素：容器高度 `containerHeight`、行高 `itemHeight`、滚动距离 `scrollTop`。可见起始下标就是"滚过了几行"，可见数量就是"容器能装几行"。
2. 为什么必须加缓冲区（Buffer）：快速滚动时浏览器来不及渲染，会出现白屏闪烁；上下各多渲染 2-5 行能让新内容在进入视口前就绪。缓冲区大小是"滚动流畅度 vs 渲染开销"的取舍参数。
3. 撑高与定位：外层容器高度设为 `total * itemHeight`（或用 `padding-top` / 内层占位 div），可视区用 `position: absolute; transform: translateY(offsetY)` 偏移。用 `transform` 而不是 `top`，因为前者只触发合成层、不引起重排。
4. 总高度必须正确：整表高度决定滚动条长度，算错会导致"滚到底部还有空白"或"最后几条滚不到"。
5. **复杂度与边界**：每次滚动计算是 O(1)，渲染的 DOM 数是 O(visibleCount + 2·buffer) 而不是 O(n)。边界：`scrollTop` 为 0 时 `startIndex` 必须钳到 0；滚到底部时 `endIndex` 要 `Math.min(total - 1, ...)` 防止越界取到 `undefined`；缓冲区不能设得过大（如 50），否则虚拟列表反而比直出更慢。
6. 不定行高的处理：无法用除法直接定位，常见方案是"预估行高 + 动态测量并缓存"（渲染后用 `ResizeObserver` 测量真实高度写回缓存，滚动时用前缀和或二分查找定位区间），定位变成 O(log n)，实现难度显著上升，也是面试官区分深度的地方。

```js
// 固定行高虚拟列表：计算可见区间
function getRange({ scrollTop, containerHeight, itemHeight, total, buffer = 3 }) {
  const start = Math.floor(scrollTop / itemHeight);              // 首个可见行
  const visibleCount = Math.ceil(containerHeight / itemHeight);  // 可见行数
  const startIndex = Math.max(0, start - buffer);                // 上缓冲
  const endIndex = Math.min(total - 1, start + visibleCount + buffer); // 下缓冲
  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,                            // 偏移量
    totalHeight: total * itemHeight,                             // 撑高总高度
  };
}
// items.slice(startIndex, endIndex + 1) 只渲染这一段
```

**追问与易错点**：

- 追问：滚动事件里直接 `setState` 有什么问题？答：高频滚动会触发大量重渲染导致掉帧；应该用 `requestAnimationFrame` 节流、用 `passive: true` 监听，或只在计算出的 `startIndex` 真正变化时才更新。
- 追问：行高不固定怎么办？答：先用预估值渲染，再用 `ResizeObserver` 或渲染后测量真实高度更新缓存；定位时用缓存的前缀和数组 + 二分查找找出起始下标。代价是定位变成 O(log n) 且实现复杂。
- 陷阱：忘记 `Math.min`/`Math.max` 边界钳制，滚到顶部或底部时下标越界取到 `undefined`；用 `top` 定位而非 `transform`，滚动时不断触发重排而掉帧。

### Q28 前端真实业务算法：正则校验、随机抽样与洗牌有哪些必须知道的坑？

**考察点**：考"看起来对但实际错"的经典陷阱——正则不加锚点、洗牌用 `sort(random)`；这两题最容易暴露基础是否扎实。

**参考答案**：

> **一句话结论**：正则校验必须加 `^` 与 `$` 锚点，并理解"正则只保证格式不保证真实性"；洗牌必须用 Fisher-Yates（`sort(() => Math.random() - 0.5)` 分布不均匀）；抽样的进阶版是蓄水池抽样。

1. 邮箱校验：`/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/` 只做基本格式校验，不能判断邮箱真实存在，也不该追求"完全符合 RFC 5322"（那条正则几百字符，维护成本极高）。业务上还要配合验证码/邮件确认。
2. 手机号校验：中国大陆用 `/^1[3-9]\d{9}$/`。**锚点不能省**——不加 `^$` 时 `"abc13812345678xyz"` 也会返回 `true`，这是最经典的误判。
3. Fisher-Yates 洗牌：从后往前遍历，每次把当前元素与 `[0, i]` 中的随机下标交换。时间 O(n)、原地交换，能保证 n! 种排列等概率。
4. 为什么 `arr.sort(() => Math.random() - 0.5)` 是错的：比较器不满足传递性，各元素被比较的次数不均等，导致某些排列概率明显偏高（n 小时偏差肉眼可见），而且不同引擎结果不同。这是最常被考"你到底懂不懂"的一题。
5. 随机抽样：从数组中不重复取 k 个，可用"洗牌后取前 k 个"，或"蓄水池抽样（Reservoir Sampling）"——后者能在**不知道总数**的数据流上等概率抽样，是处理大文件/日志流的正解。
6. **复杂度与边界**：Fisher-Yates 与蓄水池抽样都是 O(n) 时间；洗牌要拷贝数组以免改原数组，蓄水池抽样空间 O(k)。边界：`Math.random()` 不会返回 1，所以 `Math.floor(Math.random() * n)` 能正确覆盖 `[0, n-1]`；它是伪随机且不可用于加密场景（令牌、抽奖种子），涉及安全要用 `crypto.getRandomValues()`。

```js
// Fisher-Yates 洗牌：等概率 O(n)，不改原数组
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // [0, i] 均匀取一个
    [a[i], a[j]] = [a[j], a[i]];                   // 交换到末尾已定区
  }
  return a;
}
// 蓄水池抽样：从数据流中随机取 k 个（不知道总数也能等概率）
function reservoir(stream, k) {
  const res = stream.slice(0, k);
  for (let i = k; i < stream.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < k) res[j] = stream[i];                 // 以 k/(i+1) 的概率替换
  }
  return res;
}
const isEmail = (s) => /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(s);
const isPhoneCN = (s) => /^1[3-9]\d{9}$/.test(s);
```

**追问与易错点**：

- 追问：为什么随机比较器会破坏排序？答：`sort` 依赖比较结果的一致性（若 a<b、b<c 则 a<c）来决定交换，随机返回值让这个前提失效，实际等价于一次有偏的乱序；V8 对短数组走插入排序，会有明显的"靠前元素更不容易被移动"的偏差。
- 追问：洗牌和随机抽样是一回事吗？答：不是。洗牌要打乱全部元素（输出长度 n），抽样只要均匀取出 k 个（输出长度 k，且通常比洗牌更省内存，蓄水池抽样可处理无穷流）。
- 陷阱：正则忘记加锚点导致"包含即通过"；用 `sort(() => Math.random() - 0.5)` 洗牌；用 `Math.random()` 生成 token。

## 本章小结

- 复杂度看增长趋势不看常数：抓最深层的执行次数、取最高阶、扔低阶项；均摊复杂度（如 `push` 扩容、双栈队列）是对操作序列总代价摊派，不等于按概率求期望的平均复杂度。
- 排序核心是那张对比表：快排平均最快但最坏 O(n²) 且不稳定，归并稳定且适合链表但要 O(n) 空间，堆排原地且最坏可控；ES2019 起 `sort` 稳定，所以"多次稳定排序"是实现多字段排序的正规手段。
- 链表题的通用武器是哑节点 + 快慢指针：反转、判环、找中点、合并有序链表都基于同一套指针操作，"先存后继再反转"是不断链的唯一纪律。
- 栈与队列的关键是语义匹配：括号匹配与单调栈用"最近相关性"，最小栈用辅助栈记录历史最小值，双栈队列靠"只倒腾一次"拿到均摊 O(1)。
- 二分查找的唯一诀窍是全程锁定区间语义：定死 `[left, right]` 还是 `[left, right)`，收缩时左边界跳一格、右边界跳一格就不会死循环；只要具备单调性（旋转数组的局部有序、峰值题的爬坡方向）就能二分。
- 滑动窗口与双指针能降复杂度，靠的都是"一次移动排除一整批候选项"的单调性剪枝；无重复最长子串、三数之和、盛水容器是同一思想的三种外壳。
- 回溯的固定模板是"做选择 → 递归 → 撤销选择"，排列用 `used` 标记、组合与子集用 `start` 下标，收集结果必须拷贝 `[...path]`；递归转迭代用显式栈。
- 树题只有两个骨架：按层处理用 BFS（先记 `size` 切分层，用头指针代替 `shift`），子树信息汇总用 DFS 后序上收（最大深度、LCA 都是这个模式）；BST 校验必须用上下界区间或中序严格递增。
- 动态规划三步走：定义状态、写转移方程、定初始条件；推导路径是"暴力递归 → 加备忘录 → 改迭代"，0-1 背包一维压缩必须倒序遍历容量；贪心必须能证明，证不出就换 DP（零钱兑换是经典反例）。
- 前端业务算法的高频套路集中在四类：哈希聚合（分组、diff、树扁平互转）、区间与时间处理（合并、冲突检测、相对时间）、字符串解析（URL、模板、版本号、命名转换）、渲染计算（虚拟列表可见区间）；共同优化点是"把 O(n²) 的嵌套查找换成 O(1) 的 `Map`/`Set`"。
- 精度与随机是高危区：超过 2⁵³-1 用 `BigInt` 或字符串逐位算，金额转整数分；洗牌必须用 Fisher-Yates 而不是 `sort(() => Math.random() - 0.5)`，安全场景用 `crypto.getRandomValues()` 而不是 `Math.random()`。

<!-- COUNT: 28 -->
