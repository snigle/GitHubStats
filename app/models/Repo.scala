package models

import play.api.libs.json._
import play.api.libs.functional.syntax._

case class Repo(name: String, description: String, url: String)

object Repo{
    implicit val repoReader = (
    (__ \ "full_name").read[String] and
    (__ \ "description").read[String] and
    (__ \ "html_url").read[String]
  )(Repo.apply _)
  
    implicit val repoToJson = Json.writes[Repo]
}
