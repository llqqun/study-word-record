---
lang: zh-CN
title: Python
description: pyton 3+
---

# Python 基础知识

## 数据类型

int,float,True,False,str,list,tuple,set,dict  
Python 内置支持 复数，后缀 j 或 J 用于表示虚数（例如 3+5j ）
 
### 数值

整数（如，2、4、20 ）的类型是 int，带小数（如，5.0、1.6 ）的类型是 float。

```python
counter = 100          # 整型变量
miles   = 1000.0       # 浮点型变量
``` 
### 字符串

字符串类型`str`

```python
name = "runoob"

# 引号前添加 r 表示使用原始字符串
#原始字符串还有一个微妙的限制：一个原始字符串不能以奇数个 \ 字符结束
# 这样就不需要使用\进行转义

print('C:\some\name')
print(r'C:\some\name')

# 字符串可以用 + 合并（粘到一起），也可以用 * 重复
print(3 * 'un' + 'ium')
# unununium

# 相邻的两个或多个 字符串字面值 （引号标注的字符）会自动合并
# 能用于两个字面值，不能用于变量或表达式
print('Py' 'thon')

# 字符串支持 索引 （下标访问），第一个字符的索引是 0
word = 'Python'
print(word[0])
# P
#索引还支持负数，用负数索引时，从右边开始计数
# -0 和 0 一样，因此，负数索引从 -1 开始
print(word[-1])
# n

# 字符串的分片提取, 功能类似js 中的substring函数
# 索引的默认值很有用；省略开始索引时，默认值为 0，省略结束索引时，默认为到字符串的结尾
# Python 字符串不能修改，是 immutable 的。因此，为字符串中某个索引位置赋值会报错
print(word[0: 2])
word[0] = '2' # 报错
# Py


```

### 布尔型

在 Python 中，True 和 False 都是关键字，表示布尔值

```python
a = True
b = False

# 比较运算符
print(2 < 3)   # True
print(2 == 3)  # False

# 逻辑运算符
print(a and b)  # False
print(a or b)   # True
print(not a)    # False

# 类型转换
print(int(a))   # 1
print(float(b)) # 0.0
print(str(a))   # "True"

```
注意: 在 Python 中，所有非零的数字和非空的字符串、列表、元组等数据类型都被视为 True，只有 0、空字符串、空列表、空元组等被视为 False。因此，在进行布尔类型转换时，需要注意数据类型的真假性。

### 列表

Python 支持多种 复合 数据类型，可将不同值组合在一起.(类似js中的数组)

注意:  
切片操作返回包含请求元素的新列表。(进行的是列表的浅拷贝)


```python
squares = [1, 4, 9, 16, 25]

# 和字符串（及其他内置 sequence 类型）一样，列表也支持索引和切片

print(squares[0])  # 1

print(squares[-1])  # 25

print(squares[-3:])  # [9,16,25]

# 列表的合并

print(squares + [36, 49, 64, 81, 100])
# [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

# 为切片赋值可以改变列表大小，甚至清空整个列表
letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
letters[2:5] = []
# ['a', 'b', 'f', 'g']

# 列表嵌套
a = ['a', 'b', 'c']
n = [1, 2, 3]
x = [a, n]
# [['a', 'b', 'c'], [1, 2, 3]]
```

## 变量

变量的声明: 变量名 = 变量值

```python
# 定义
var = '变量'
name = 123
obj = {}

# 赋值
z = bx = cx = 1

a, b, c, d = 20, 5.5, True, 4 + 3j

```

### 数值运算

Python 全面支持浮点数；混合类型运算数的运算会把整数转换为浮点数

```python

print(5 + 4) # 9 加法
print(4.3 - 2.5) #1.7999999 减法
print(4.3 - 2) # 2.3 减法
print(3 * 7) # 21 乘法
print(2 / 4) # 0.5 除法，得到一个浮点数
print(4 / 2) # 2.0
print(2 // 4) # 0 除法，得到一个整数
print(17 % 3) # 2 取余
print(2 ** 5) # 32 乘方

```