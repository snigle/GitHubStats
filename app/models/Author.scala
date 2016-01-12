package models

import play.api.libs.json.Reads
import play.api.libs.json._
import play.api.libs.functional.syntax._


case class Author(login: Option[String],
                  name: Option[String],
                  email: Option[String],
                  avatar_url: Option[String],
                  url: Option[String],
                  total: Option[Int])

object Author{
  implicit val authorReaderFromCommit: Reads[Author] = (
    (__ \ "author" \ "login").readNullable[String] and
    (__ \ "commit" \ "author" \ "name").readNullable[String] and
    (__ \ "commit" \ "author" \ "email").readNullable[String] and
    (__ \ "author" \ "avatar_url").readNullable[String] and
    (__ \ "author" \ "html_url").readNullable[String] and
    (__ \ "author" \ "total").readNullable[Int]
  )(Author.apply _)
  implicit val authorReader: Reads[Author] = (
    (__ \ "login").readNullable[String] and
    (__ \ "login").readNullable[String] and
    (__ \ "email").readNullable[String] and
    (__ \ "avatar_url").readNullable[String] and
    (__ \ "html_url").readNullable[String] and
    (__ \ "total").readNullable[Int]
  )(Author.apply _)
  
  //Json writers
  implicit val authorToJson = new Writes[Author] {
    def writes(author: Author) = Json.obj(
      "login" -> author.login,
      "name" -> author.name,
      "email" -> author.email,
      "avatar_url" -> author.avatar_url,
      "url" -> author.url,
      "total" -> Json.toJson(author.total.getOrElse(0))
    )
  }
}