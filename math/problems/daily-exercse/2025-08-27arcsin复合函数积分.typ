= 2025-08-27 arcsin复合函数积分
== 题目
$f prime=arcsin((x-1)^2)$，$f(0)=0$，求$ integral_0^1 f(x) dif x. $

== 解答
$
  f(x) & = f(0)+integral_0^x arcsin((t-1)^2) dif t \
       & = integral_0^x arcsin((t-1)^2) dif t \
       & =[t arcsin((t-1)^2) ]_0^x - integral_0^x t dif arcsin((t-1)^2) \
       & =x arcsin((x-1)^2) - integral_0^x frac(t dot 2(t-1), sqrt(1-(t-1)^4)) dif t \
$
那么
$
  integral_0^1 f(x) dif x & = integral_0^1 (integral_0^x arcsin((t-1)^2) dif t) dif x \
$
