const PREC = {
  IMMEDIATE_CHILD: 1
};

module.exports = grammar({
  name: "query",
  rules: {
    program: $ => repeat($._definition),
    _definition: $ =>
      choice(
        $.named_node,
        $.anonymous_node,
        $.grouping,
        $.predicate,
        $.list,
        $.comment,
        $._expressions
      ),
    _expressions: $ =>
      choice(
        $.immediate_child_expression,
        $.first_child_expression,
        $.last_child_expression
      ),
    _string: $ => seq('"', repeat(token.immediate(/[^"]/)), '"'),
    _field_name: $ => seq($.identifier, ":"),
    _child_op: $ => ".",
    immediate_child_expression: $ =>
      prec.left(
        PREC.IMMEDIATE_CHILD,
        seq(
          field("left", $.named_node),
          $._child_op,
          field("right", $.named_node)
        )
      ),
    first_child_expression: $ =>
      seq($._child_op, field("argument", $.named_node)),
    last_child_expression: $ =>
      seq(field("argument", $.named_node), $._child_op),
    predicate_type: $ => choice("?", "!"),
    quantifier: $ => choice("*", "+", "?"),
    field_definition: $ => seq(field("name", $._field_name), $._definition),
    identifier: $ => /[a-zA-Z0-9.\-_\$#]+/,
    capture: $ => seq("@", field("name", $.identifier)),
    string: $ => $._string,
    parameters: $ => repeat1(choice($.capture, $.string, $.identifier)),
    comment: $ => seq(";", /.*/),
    list: $ => seq("[", repeat($._definition), "]", quantifier($), captures($)),
    grouping: $ =>
      seq("(", repeat($._definition), ")", quantifier($), captures($)),
    anonymous_node: $ =>
      seq($._string, optional(field("quantifier", $.quantifier)), captures($)),
    named_node: $ =>
      seq(
        "(",
        field("name", $.identifier),
        repeat(choice($._definition, $.field_definition)),
        ")",
        quantifier($),
        captures($)
      ),
    predicate: $ =>
      seq(
        "(",
        field("name", seq($.identifier, field("type", $.predicate_type))),
        field("parameters", $.parameters),
        ")"
      )
  }
});

function captures($) {
  return optional(repeat($.capture));
}

function quantifier($) {
  return optional(field("quantifier", $.quantifier));
}
