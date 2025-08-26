= 2025-08-26 整函数
== 题目
$f(z)$是整函数，$f(z)=f(z-z^2)$，求证$f(z)$必为常数。


== 解答
利用柯西-黎曼方程，记$u$和$v$是实的二元函数，记$z=x+y i$，我们有

$ f(z)=u(x,y)+v(x,y)i $

$f(z-z^2)$显然也是解析的，有
$
  f(z-z^2) & =f((x+y i)-(x+y i)^2) \
           & = f((x - x^2 + y^2) + (y - 2 x y)i) \
           & = u(x - x^2 + y^2, y - 2 x y) + v(x - x^2 + y^2, y - 2 x y)i
$

简化记号令$s=x - x^2 + y^2, t= y - 2 x y$，我们有

$ f(z-z^2) = u(s,t) + v(s,t)i $

由柯西-黎曼方程可得
$
       frac(partial u, partial x) & = frac(partial v, partial y) #numbering("(1)", 1) \
       frac(partial u, partial y) & = -frac(partial v, partial x) #numbering("(1)", 2) \
  frac(partial u(s,t), partial x) & = frac(partial v(s,t), partial y) #numbering("(1)", 3) \
  frac(partial u(s,t), partial y) & = -frac(partial v(s,t), partial x) #numbering("(1)", 4) \
$

$(3)(4)$由链式法则可得
$
  frac(partial u(s,t), partial x) & = frac(partial u(s,t), partial s) frac(partial s, partial x) + frac(partial u(s,t), partial t) frac(partial t, partial x) \
  frac(partial v(s,t), partial y) & = frac(partial v(s,t), partial s) frac(partial s, partial y) + frac(partial v(s,t), partial t) frac(partial t, partial y) \
  frac(partial u(s,t), partial s) frac(partial s, partial x) + frac(partial u(s,t), partial t) frac(partial t, partial x) & = frac(partial v(s,t), partial s) frac(partial s, partial y) + frac(partial v(s,t), partial t) frac(partial t, partial y) #numbering("(1)", 5)
$

用$(1)(2)$代入$(5)$中对$s,t$的情形，可得
$
  p frac(partial s, partial x) + q frac(partial t, partial x) & = -q frac(partial s, partial y) + p frac(partial t, partial y) \
  p (1-2x) + q(-2y) & = -q (2y) + p (1-2x) #numbering("(1)", 6) \
$





