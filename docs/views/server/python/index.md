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
counter = 100  # 整型变量
miles = 1000.0  # 浮点型变量
``` 

### 字符串

字符串类型`str`

```python
name = "runoob"

# 引号前添加 r 表示使用原始字符串
# 原始字符串还有一个微妙的限制：一个原始字符串不能以奇数个 \ 字符结束
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
# 索引还支持负数，用负数索引时，从右边开始计数
# -0 和 0 一样，因此，负数索引从 -1 开始
print(word[-1])
# n

# 字符串的分片提取, 功能类似js 中的substring函数
# 索引的默认值很有用；省略开始索引时，默认值为 0，省略结束索引时，默认为到字符串的结尾
# Python 字符串不能修改，是 immutable 的。因此，为字符串中某个索引位置赋值会报错
print(word[0: 2])
word[0] = '2'  # 报错
# Py


```

### 布尔型

在 Python 中，True 和 False 都是关键字，表示布尔值

```python
a = True
b = False

# 比较运算符
print(2 < 3)  # True
print(2 == 3)  # False

# 逻辑运算符
print(a and b)  # False
print(a or b)  # True
print(not a)  # False

# 类型转换
print(int(a))  # 1
print(float(b))  # 0.0
print(str(a))  # "True"

```

注意: 在 Python 中，所有非零的数字和非空的字符串、列表、元组等数据类型都被视为 True，只有 0、空字符串、空列表、空元组等被视为
False。因此，在进行布尔类型转换时，需要注意数据类型的真假性。

### 列表 list

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
>常用的操作函数

`append(x)` 将 x 添加到序列的末尾 (等同于 s[len(s):len(s)] = [x])
```python
s = [1,2,3]
s.append(4)
# [1,2,3,4]
```
`s.extend(t)` 用 t 的内容扩展 s (基本上等同于 s[len(s):len(s)] = t)
```python

```
`s.insert(i, x)` 在由 i 给出的索引位置将 x 插入 s (等同于 s[i:i] = [x])
```python

```

`s.pop(i)` 提取在 i 位置上的项，并将其从 列表 中移除

`s.remove(x)` 删除 s 中第一个 s[i] 等于 x 的项目。

### 元组 tuple

组中只包含一个元素时，需要在元素后面添加逗号 , ，否则括号会被当作运算符使用

```python

tup1 = (50)  # 不加逗号，类型为整型
tup1 = (50,)  # 加上逗号，类型为元组

```

元组的元素不能修改

```python
#!/usr/bin/python3
 
tup1 = (12, 34.56)
tup2 = ('abc', 'xyz')
 
# 以下修改元组元素操作是非法的。
# tup1[0] = 100
 
# 创建一个新的元组
tup3 = tup1 + tup2
print (tup3)
```

元组中的元素值是不允许修改的，但我们可以对元组进行连接组合

```python
tup1 = (12, 34.56)
tup2 = ('abc', 'xyz')
 
# 以下修改元组元素操作是非法的。
# tup1[0] = 100
 
# 创建一个新的元组
tup3 = tup1 + tup2
print (tup3)
```

删除元组
```python
tup = ('Google', 'Runoob', 1997, 2000)
 
print (tup)
del tup
print ("删除后的元组 tup : ")
print (tup)
```

所谓元组的不可变指的是元组所指向的内存中的内容不可变

```python
tup = ('r', 'u', 'n', 'o', 'o', 'b')
tup[0] = 'g'     # 不支持修改元素

id(tup)     # 查看内存地址

tup = (1,2,3)
id(tup)
```

### 字典 dict 

```python

```

### 集合 set

```python

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

print(5 + 4)  # 9 加法
print(4.3 - 2.5)  #1.7999999 减法
print(4.3 - 2)  # 2.3 减法
print(3 * 7)  # 21 乘法
print(2 / 4)  # 0.5 除法，得到一个浮点数
print(4 / 2)  # 2.0
print(2 // 4)  # 0 除法，得到一个整数
print(17 % 3)  # 2 取余
print(2 ** 5)  # 32 乘方

```

### 三目运算

左边结果 if 条件成立返回左边,不成立返回右边 else 右边结果

```python
a = 10
b = 20
c = a if a > b else b
```